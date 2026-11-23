import { connectToDatabase } from "@/lib/db/client";
import { AiProfile } from "@/lib/db/models";
import { profileSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { toProfileDTO } from "@/lib/serialize";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();
    const profiles = await AiProfile.find().sort({ isDefault: -1, name: 1 }).lean();
    return ok(profiles.map(toProfileDTO));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    if (parsed.data.isDefault) {
      await AiProfile.updateMany({}, { $set: { isDefault: false } });
    }

    const profile = await AiProfile.create({
      name: parsed.data.name,
      slug: parsed.data.slug ?? slugify(parsed.data.name),
      description: parsed.data.description ?? "",
      systemPrompt: parsed.data.systemPrompt,
      temperature: parsed.data.temperature ?? 0.4,
      isDefault: parsed.data.isDefault ?? false,
    });

    return ok(toProfileDTO(profile.toObject()), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
