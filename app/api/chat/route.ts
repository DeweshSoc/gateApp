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

    // Resolve or create the conversation.
    let conversation = input.conversationId
      ? await Conversation.findById(input.conversationId)
      : null;

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
    const userMessage = await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: input.message,
      tokenCount: estimateTokens(input.message),
    });

    // Load prior history (excluding the just-saved message is unnecessary; it is included).
    const history = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    // Resolve preferences + optional profile for the system prompt.
    const preference = await Preference.findOne({ userId: "singleton" }).lean();
    let profilePrompt: string | null = null;
    const profileId = input.profileId ?? preference?.defaultProfileId ?? null;
    if (profileId) {
      const profile = await AiProfile.findById(profileId).lean();
      if (profile) profilePrompt = profile.systemPrompt;
    }

    let subjectContext = "";
    const subjectId = input.subjectId ?? conversation.subjectId ?? null;
    if (subjectId) {
      const subject = await Subject.findById(subjectId).lean();
      if (subject) {
        subjectContext = `The student is currently studying ${subject.name} (${subject.code}). Focus your answer on this subject area.`;
      }
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
      contextWindow: preference?.contextWindow ?? DEFAULT_CONTEXT_WINDOW,
    });

    // Resolve provider and start streaming.
    const { provider, config } = await resolveProvider(input.providerId);
    const controller = new AbortController();
    request.signal.addEventListener("abort", () => controller.abort());

    const sourceStream = await provider.chatStream(contextMessages, {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
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
