import { connectToDatabase } from "@/lib/db/client";
import { Topic } from "@/lib/db/models";
import { handleError, ok } from "@/lib/api";
import { toTopicDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const subjectId = url.searchParams.get("subjectId");

    await connectToDatabase();
    const filter = subjectId ? { subjectId } : {};
    const topics = await Topic.find(filter).sort({ order: 1, name: 1 }).lean();
    return ok(topics.map(toTopicDTO));
  } catch (error) {
    return handleError(error);
  }
}
