import { connectToDatabase } from "@/lib/db/client";
import { Note } from "@/lib/db/models";
import { updateNoteSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { toNoteDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    const note = await Note.findByIdAndUpdate(id, parsed.data, { new: true }).lean();
    if (!note) return fail("NOT_FOUND", "Note not found.", 404);

    return ok(toNoteDTO(note));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const deleted = await Note.findByIdAndDelete(id);
    if (!deleted) return fail("NOT_FOUND", "Note not found.", 404);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}
