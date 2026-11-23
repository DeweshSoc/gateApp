import { connectToDatabase } from "@/lib/db/client";
import { Conversation } from "@/lib/db/models";
import { createConversationSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { toConversationDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();
    const conversations = await Conversation.find({ isArchived: false })
      .sort({ isPinned: -1, lastMessageAt: -1, createdAt: -1 })
      .limit(200)
      .lean();
    return ok(conversations.map(toConversationDTO));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = createConversationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    const conversation = await Conversation.create({
      title: parsed.data.title ?? "New conversation",
      subjectId: parsed.data.subjectId ?? null,
      topicId: parsed.data.topicId ?? null,
    });

    return ok(toConversationDTO(conversation.toObject()), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
