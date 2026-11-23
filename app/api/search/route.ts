import { connectToDatabase } from "@/lib/db/client";
import { Note, Message } from "@/lib/db/models";
import { handleError, ok } from "@/lib/api";
import { toNoteDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Keyword search across notes and messages. Uses a simple case-insensitive
 * regex so it works without a text index; results are capped.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 50);

    if (!q) return ok({ notes: [], messages: [] });

    const regex = new RegExp(escapeRegex(q), "i");
    await connectToDatabase();

    const [notes, messages] = await Promise.all([
      Note.find({ $or: [{ title: regex }, { content: regex }, { tags: regex }] })
        .limit(limit)
        .lean(),
      Message.find({ content: regex })
        .select("conversationId role content createdAt")
        .limit(limit)
        .lean(),
    ]);

    return ok({
      notes: notes.map(toNoteDTO),
      messages: messages.map((m) => ({
        id: String(m._id),
        conversationId: String(m.conversationId),
        role: m.role,
        snippet: String(m.content).slice(0, 160),
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
