import { connectToDatabase } from "@/lib/db/client";
import { Pyq } from "@/lib/db/models";
import { fail, handleError, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = (await readJson(request)) as { isBookmarked?: unknown };
    if (typeof body.isBookmarked !== "boolean") {
      return fail("VALIDATION_ERROR", "isBookmarked must be a boolean.", 422);
    }

    await connectToDatabase();
    const pyq = await Pyq.findByIdAndUpdate(
      id,
      { isBookmarked: body.isBookmarked },
      { new: true },
    ).lean();
    if (!pyq) return fail("NOT_FOUND", "Question not found.", 404);

    return ok({ id, isBookmarked: Boolean(pyq.isBookmarked) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const deleted = await Pyq.findByIdAndDelete(id);
    if (!deleted) return fail("NOT_FOUND", "Question not found.", 404);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}
