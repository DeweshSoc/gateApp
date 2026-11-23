import { connectToDatabase } from "@/lib/db/client";
import { Conversation, Message } from "@/lib/db/models";
import { updateConversationSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { toConversationDTO, toMessageDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const conversation = await Conversation.findById(id).lean();
    if (!conversation) return fail("NOT_FOUND", "Conversation not found.", 404);

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    return ok({
      conversation: toConversationDTO(conversation),
      messages: messages.map(toMessageDTO),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    const parsed = updateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    const conversation = await Conversation.findByIdAndUpdate(id, parsed.data, {
      new: true,
    }).lean();
    if (!conversation) return fail("NOT_FOUND", "Conversation not found.", 404);

    return ok(toConversationDTO(conversation));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const deleted = await Conversation.findByIdAndDelete(id);
    if (!deleted) return fail("NOT_FOUND", "Conversation not found.", 404);

    await Message.deleteMany({ conversationId: id });
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}
