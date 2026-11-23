import { connectToDatabase } from "@/lib/db/client";
import { Note, Message } from "@/lib/db/models";
import { handleError, ok } from "@/lib/api";
import { toNoteDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Full-text keyword search across notes and messages. Uses MongoDB `$text`
 * indexes (Notes: title/content/tags; Messages: content) so the query is served
 * by the index instead of scanning every document with an unanchored regex.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 50);

    if (!q) return ok({ notes: [], messages: [] });

    await connectToDatabase();

    const [notes, messages] = await Promise.all([
      Note.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean(),
      Message.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } },
      )
        .select("conversationId role content createdAt")
        .sort({ score: { $meta: "textScore" } })
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
