import { connectToDatabase } from "@/lib/db/client";
import {
  Conversation,
  Message,
  Preference,
  AiProfile,
  Subject,
} from "@/lib/db/models";
import { chatRequestSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { resolveProvider } from "@/lib/ai/registry";
import { composeSystemPrompt } from "@/lib/ai/system-prompts";
import { buildActiveContext } from "@/lib/ai/context";
import { toSSEStream, SSE_HEADERS } from "@/lib/ai/stream";
import { AiProviderError } from "@/lib/ai/provider";
import { deriveTitle } from "@/lib/utils";
import { estimateTokens } from "@/lib/ai/context";
import { DEFAULT_CONTEXT_WINDOW } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid request.",
        422,
      );
    }

    const input = parsed.data;
    await connectToDatabase();

    // Resolve or create the conversation. Preferences are independent of the
    // conversation, so fetch them in parallel with the lookup.
    const [existing, preference] = await Promise.all([
      input.conversationId
        ? Conversation.findById(input.conversationId)
        : Promise.resolve(null),
      Preference.findOne({ userId: "singleton" }).lean(),
    ]);

    let conversation = existing;
    if (!conversation) {
      conversation = await Conversation.create({
        title: deriveTitle(input.message),
        subjectId: input.subjectId ?? null,
        topicId: input.topicId ?? null,
        messageCount: 0,
      });
    } else if (input.subjectId || input.topicId) {
      // Keep the conversation's study context in sync with the latest selection.
      await Conversation.updateOne(
        { _id: conversation._id },
        {
          $set: {
            ...(input.subjectId ? { subjectId: input.subjectId } : {}),
            ...(input.topicId ? { topicId: input.topicId } : {}),
          },
        },
      );
    }

    // Persist the user message.
    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: input.message,
      tokenCount: estimateTokens(input.message),
    });

    const contextWindow = preference?.contextWindow ?? DEFAULT_CONTEXT_WINDOW;
    const profileId = input.profileId ?? preference?.defaultProfileId ?? null;
    const subjectId = input.subjectId ?? conversation.subjectId ?? null;

    // Fetch only what the context needs: the most recent `contextWindow`
    // messages plus any flagged (important) messages. All reads run in
    // parallel — history, profile, subject, and provider resolution.
    type HistoryRow = {
      _id: unknown;
      role: string;
      content: string;
      isImportant?: boolean;
      createdAt: Date;
    };

    const [recentDesc, important, profile, subject, resolved] = await Promise.all([
      Message.find({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .limit(contextWindow)
        .lean<HistoryRow[]>(),
      Message.find({ conversationId: conversation._id, isImportant: true })
        .select("_id role content isImportant createdAt")
        .lean<HistoryRow[]>(),
      profileId ? AiProfile.findById(profileId).lean() : Promise.resolve(null),
      subjectId ? Subject.findById(subjectId).lean() : Promise.resolve(null),
      resolveProvider(input.providerId),
    ]);

    // Merge recent + important, dedupe by id, and order chronologically.
    const byId = new Map<string, HistoryRow>();
    for (const m of recentDesc) byId.set(String(m._id), m);
    for (const m of important) byId.set(String(m._id), m);
    const history = Array.from(byId.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const profilePrompt: string | null = profile?.systemPrompt ?? null;

    let subjectContext = "";
    if (subject) {
      subjectContext = `The student is currently studying ${subject.name} (${subject.code}). Focus your answer on this subject area.`;
    }

    const systemPrompt = composeSystemPrompt({
      profilePrompt,
      customPrompt: [preference?.customSystemPrompt, subjectContext]
        .filter(Boolean)
        .join("\n\n"),
      responseStyle: preference?.responseStyle ?? "balanced",
    });

    const contextMessages = buildActiveContext({
      systemPrompt,
      history: history.map((m) => ({
        role: m.role,
        content: m.content,
        isImportant: m.isImportant,
      })),
      summary: conversation.summary ?? null,
      contextWindow,
    });

    // Start streaming with the already-resolved provider.
    const controller = new AbortController();
    request.signal.addEventListener("abort", () => controller.abort());

    const sourceStream = await resolved.provider.chatStream(contextMessages, {
      model: resolved.config.model,
      temperature: resolved.config.temperature,
      maxTokens: resolved.config.maxTokens,
      signal: controller.signal,
    });

    // Tee the text stream: one branch to the client, one accumulated for persistence.
    const [clientStream, persistStream] = sourceStream.tee();

    void persistAssistantMessage({
      persistStream,
      conversationId: String(conversation._id),
    });

    const headers = new Headers(SSE_HEADERS);
    headers.set("x-conversation-id", String(conversation._id));

    return new Response(toSSEStream(clientStream), { headers });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return fail(error.code, error.message, error.status);
    }
    return handleError(error);
  }
}

/**
 * Drain the persistence branch fully, then write the assistant message and
 * update conversation metadata. Errors are swallowed so a failed write never
 * breaks the client stream.
 */
async function persistAssistantMessage(options: {
  persistStream: ReadableStream<Uint8Array>;
  conversationId: string;
}): Promise<void> {
  const { persistStream, conversationId } = options;
  const reader = persistStream.getReader();
  const decoder = new TextDecoder();
  let content = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      content += decoder.decode(value, { stream: true });
    }
  } catch {
    // Provider stream error mid-way: persist whatever arrived.
  }

  if (!content.trim()) return;

  try {
    await Message.create({
      conversationId,
      role: "assistant",
      content,
      tokenCount: estimateTokens(content),
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      $inc: { messageCount: 2 },
      lastMessageAt: new Date(),
    });
  } catch {
    // Non-fatal: the user still received the response.
  }
}
