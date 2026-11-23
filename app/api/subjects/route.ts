import { connectToDatabase } from "@/lib/db/client";
import { Subject } from "@/lib/db/models";
import { handleError, ok } from "@/lib/api";
import { toSubjectDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();
    const subjects = await Subject.find().sort({ order: 1, name: 1 }).lean();
    return ok(subjects.map(toSubjectDTO));
  } catch (error) {
    return handleError(error);
  }
}
