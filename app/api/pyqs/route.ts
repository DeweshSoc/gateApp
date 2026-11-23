import { connectToDatabase } from "@/lib/db/client";
import { Pyq } from "@/lib/db/models";
import { pyqSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const subjectId = url.searchParams.get("subjectId");
    const year = url.searchParams.get("year");

    await connectToDatabase();
    const filter: Record<string, unknown> = {};
    if (subjectId) filter.subjectId = subjectId;
    if (year) filter.year = Number(year);

    const pyqs = await Pyq.find(filter).sort({ year: -1, createdAt: -1 }).limit(200).lean();
    return ok(
      pyqs.map((p) => ({
        id: String(p._id),
        subjectId: p.subjectId ? String(p.subjectId) : null,
        topicId: p.topicId ? String(p.topicId) : null,
        year: p.year,
        question: p.question,
        options: p.options,
        explanation: p.explanation,
        difficulty: p.difficulty,
        isBookmarked: p.isBookmarked,
        isVerified: p.isVerified,
      })),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = pyqSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    const pyq = await Pyq.create(parsed.data);
    return ok({ id: String(pyq._id) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
