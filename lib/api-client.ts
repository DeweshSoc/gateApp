import type { ApiResponse } from "@/types";

/** Active GET requests keyed by URL, so concurrent callers share one fetch. */
const inflight = new Map<string, Promise<unknown>>();
/** Short-lived cache of successful GET results to avoid duplicate round-trips. */
const cache = new Map<string, { value: unknown; expires: number }>();
const DEFAULT_TTL_MS = 2_000;

interface ApiFetchOptions extends RequestInit {
  /** Skip the in-flight dedup + short cache (use for POST/PATCH/DELETE). */
  noCache?: boolean;
  /** Cache TTL in ms for GET requests. Defaults to 2000. */
  ttl?: number;
}

function isGet(init?: RequestInit): boolean {
  return !init?.method || init.method.toUpperCase() === "GET";
}

/** Typed fetch wrapper for the app's API routes (client-safe). */
export async function apiFetch<T>(
  input: string,
  init?: ApiFetchOptions,
): Promise<T> {
  const { noCache, ttl = DEFAULT_TTL_MS, ...requestInit } = init ?? {};

  // Only GET requests are safe to dedup/cache.
  const cacheable = !noCache && isGet(requestInit);

  if (cacheable) {
    const cached = cache.get(input);
    if (cached && cached.expires > Date.now()) {
      return cached.value as T;
    }
    const pending = inflight.get(input);
    if (pending) return pending as Promise<T>;
  }

  const run = (async (): Promise<T> => {
    const response = await fetch(input, {
      headers: {
        "Content-Type": "application/json",
        ...(requestInit.headers ?? {}),
      },
      ...requestInit,
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

    if (cacheable) {
      cache.set(input, { value: body.data, expires: Date.now() + ttl });
    }
    return body.data;
  })();

  if (cacheable) {
    inflight.set(input, run);
    run.finally(() => inflight.delete(input)).catch(() => {
      // Swallow so a rejected request does not leave an unhandled rejection.
    });
  }

  return run;
}

/** Invalidate cached GET results for a URL (or a URL prefix). */
export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export const jsonBody = (data: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(data),
});
