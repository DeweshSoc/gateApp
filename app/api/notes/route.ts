import { connectToDatabase } from "@/lib/db/client";
import { Note } from "@/lib/db/models";
import { noteSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { toNoteDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const favorite = url.searchParams.get("favorite") === "true";
    const subjectId = url.searchParams.get("subjectId");

    await connectToDatabase();
    const filter: Record<string, unknown> = {};
    if (favorite) filter.isFavorite = true;
    if (subjectId) filter.subjectId = subjectId;

    const notes = await Note.find(filter).sort({ updatedAt: -1 }).limit(200).lean();
    return ok(notes.map(toNoteDTO));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    const note = await Note.create({
      title: parsed.data.title,
      content: parsed.data.content,
      subjectId: parsed.data.subjectId ?? null,
      topicId: parsed.data.topicId ?? null,
      tags: parsed.data.tags ?? [],
      importance: parsed.data.importance ?? "medium",
      isFavorite: parsed.data.isFavorite ?? false,
      sourceMessageId: parsed.data.sourceMessageId ?? null,
    });

    return ok(toNoteDTO(note.toObject()), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
