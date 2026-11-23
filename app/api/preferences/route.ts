import { connectToDatabase } from "@/lib/db/client";
import { Preference } from "@/lib/db/models";
import { preferenceSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import type { PreferenceDTO } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SINGLETON = "singleton";

function toDTO(doc: Record<string, unknown> | null): PreferenceDTO {
  return {
    theme: (doc?.theme as PreferenceDTO["theme"]) ?? "system",
    defaultSubjectId: doc?.defaultSubjectId ? String(doc.defaultSubjectId) : null,
    defaultProfileId: doc?.defaultProfileId ? String(doc.defaultProfileId) : null,
    customSystemPrompt: (doc?.customSystemPrompt as string | null) ?? null,
    responseStyle: (doc?.responseStyle as PreferenceDTO["responseStyle"]) ?? "balanced",
    streamingEnabled: Boolean(doc?.streamingEnabled ?? true),
    contextWindow: Number(doc?.contextWindow ?? 12),
  };
}

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();
    const preference = await Preference.findOne({ userId: SINGLETON }).lean();
    return ok(toDTO(preference as Record<string, unknown> | null));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = preferenceSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();
    const preference = await Preference.findOneAndUpdate(
      { userId: SINGLETON },
      { $set: parsed.data, $setOnInsert: { userId: SINGLETON } },
      { new: true, upsert: true },
    ).lean();

    return ok(toDTO(preference as Record<string, unknown>));
  } catch (error) {
    return handleError(error);
  }
}
