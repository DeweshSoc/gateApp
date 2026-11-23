import { connectToDatabase } from "@/lib/db/client";
import { AiProvider } from "@/lib/db/models";
import { providerSchema } from "@/lib/validation/schemas";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { toProviderDTO } from "@/lib/serialize";
import { encrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    const parsed = providerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid.", 422);
    }

    await connectToDatabase();

    if (parsed.data.isActive) {
      await AiProvider.updateMany({ _id: { $ne: id } }, { $set: { isActive: false } });
    }

    const update: Record<string, unknown> = { ...parsed.data };
    delete update.apiKey;
    if (parsed.data.apiKey) {
      update.apiKeyEncrypted = encrypt(parsed.data.apiKey);
    }

    const provider = await AiProvider.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!provider) return fail("NOT_FOUND", "Provider not found.", 404);

    return ok(toProviderDTO(provider));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const deleted = await AiProvider.findByIdAndDelete(id);
    if (!deleted) return fail("NOT_FOUND", "Provider not found.", 404);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}
