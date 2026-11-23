/**
 * Wrap a text-chunk stream (Uint8Array chunks) in an SSE-framed stream where
 * each frame is `data: {json}\n\n`. Emits a final `data: [DONE]` frame.
 *
 * Chunks arriving within `flushIntervalMs` are coalesced into a single frame to
 * cut the number of SSE frames (and client `JSON.parse`/re-render churn) without
 * noticeably delaying the visible stream.
 */
export function toSSEStream(
  source: ReadableStream<Uint8Array>,
  flushIntervalMs = 24,
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let pending = "";
      let timer: ReturnType<typeof setTimeout> | null = null;

      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const flush = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (pending) {
          send({ delta: pending });
          pending = "";
        }
      };

      const schedule = () => {
        if (timer) return;
        timer = setTimeout(() => {
          timer = null;
          if (pending) {
            send({ delta: pending });
            pending = "";
          }
        }, flushIntervalMs);
      };

      const pump = async () => {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            if (!text) continue;
            pending += text;
            schedule();
          }
          flush();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          flush();
          send({ error: error instanceof Error ? error.message : "Stream failed." });
          controller.close();
        }
      };

      void pump();
    },
    cancel(reason) {
      void reader.cancel(reason);
    },
  });
}

/** Response headers for an SSE streaming endpoint. */
export const SSE_HEADERS: HeadersInit = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};
