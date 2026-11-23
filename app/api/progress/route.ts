import { connectToDatabase } from "@/lib/db/client";
import { Progress } from "@/lib/db/models";
import { progressSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();
    const items = await Progress.find().sort({ updatedAt: -1 }).lean();
    return ok(
      items.map((p) => ({
        id: String(p._id),
        subjectId: p.subjectId ? String(p.subjectId) : null,
        topicId: p.topicId ? String(p.topicId) : null,
        status: p.status,
        note: p.note ?? null,
        updatedAt: p.updatedAt,
      })),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    const { subjectId, topicId, status, note } = parsed.data;
    if (!subjectId && !topicId) {
      return fail("VALIDATION_ERROR", "A subject or topic is required.", 422);
    }

    const filter = subjectId ? { subjectId } : { topicId };
    const progress = await Progress.findOneAndUpdate(
      filter,
      { $set: { status, note: note ?? null, subjectId: subjectId ?? null, topicId: topicId ?? null } },
      { new: true, upsert: true },
    ).lean();

    return ok({
      id: String(progress._id),
      subjectId: progress.subjectId ? String(progress.subjectId) : null,
      topicId: progress.topicId ? String(progress.topicId) : null,
      status: progress.status,
      note: progress.note ?? null,
    });
  } catch (error) {
    return handleError(error);
  }
}
