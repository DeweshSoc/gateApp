import { connectToDatabase } from "@/lib/db/client";
import { Pyq, PyqAttempt } from "@/lib/db/models";
import { attemptSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = attemptSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    const pyq = await Pyq.findById(parsed.data.pyqId).lean();
    if (!pyq) return fail("NOT_FOUND", "Question not found.", 404);

    const options = pyq.options ?? [];
    const correctIndex = options.findIndex((o) => o.isCorrect);
    const isCorrect = correctIndex === parsed.data.selectedOption;

    const attempt = await PyqAttempt.create({
      pyqId: parsed.data.pyqId,
      selectedOption: parsed.data.selectedOption,
      isCorrect,
    });

    return ok(
      {
        id: String(attempt._id),
        isCorrect,
        correctOption: correctIndex,
        explanation: pyq.explanation ?? "",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
