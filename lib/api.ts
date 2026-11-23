import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types";
import { AiProviderError } from "@/lib/ai/provider";

/** Build a success envelope. */
export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

/** Build an error envelope. */
export function fail(
  code: string,
  message: string,
  status = 400,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

/**
 * Normalize any thrown error into a consistent error envelope. Zod issues are
 * surfaced as `VALIDATION_ERROR` with the first field message.
 */
export function handleError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return fail("VALIDATION_ERROR", first?.message ?? "Invalid request.", 422);
  }

  // Preserve provider-specific machine codes and HTTP semantics.
  if (error instanceof AiProviderError) {
    const response = fail(error.code, error.message, error.status);
    if (error.retryAfter !== undefined) {
      response.headers.set("Retry-After", String(error.retryAfter));
    }
    return response;
  }

  if (error instanceof Error) {
    if (error.message.includes("MONGODB_URI")) {
      return fail("DB_NOT_CONFIGURED", "Database is not configured.", 503);
    }
    return fail("INTERNAL_ERROR", error.message, 500);
  }

  return fail("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}

/** Parse JSON body safely; null when the body is empty or malformed. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
