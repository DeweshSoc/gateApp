import { connectToDatabase } from "@/lib/db/client";
import { AiProvider } from "@/lib/db/models";
import { providerSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { toProviderDTO } from "@/lib/serialize";
import { encrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();
    const providers = await AiProvider.find().sort({ createdAt: 1 }).lean();
    // Never expose apiKeyEncrypted; DTO only reports whether a key exists.
    return ok(providers.map(toProviderDTO));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const parsed = providerSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }
    if (!parsed.data.apiKey) {
      return fail("VALIDATION_ERROR", "API key is required.", 422);
    }

    await connectToDatabase();

    // Only one provider may be active at a time.
    if (parsed.data.isActive) {
      await AiProvider.updateMany({}, { $set: { isActive: false } });
    }

    const provider = await AiProvider.create({
      name: parsed.data.name,
      baseUrl: parsed.data.baseUrl,
      apiKeyEncrypted: encrypt(parsed.data.apiKey),
      model: parsed.data.model,
      temperature: parsed.data.temperature ?? 0.4,
      maxTokens: parsed.data.maxTokens ?? 2048,
      isActive: parsed.data.isActive ?? true,
    });

    return ok(toProviderDTO(provider.toObject()), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
