import type { ApiResponse } from "@/types";

/** Typed fetch wrapper for the app's API routes (client-safe). */
export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (!body.ok) {
    throw new Error(body.error.message || `Request failed (${body.error.code}).`);
  }

  return body.data;
}

export const jsonBody = (data: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(data),
});
