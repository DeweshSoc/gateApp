import type { ChatCompletionMessage } from "@/types";
import { AiProviderError, type AiProvider, type ChatOptions, type ProviderConfig } from "./provider";

interface StreamChunk {
  choices?: Array<{ delta?: { content?: string | null }; finish_reason?: string | null }>;
  error?: { message?: string; code?: string };
}

/**
 * Adapter for any endpoint implementing the OpenAI `/chat/completions` wire
 * protocol (OpenAI, DeepSeek, OpenRouter, Groq, Together, Ollama, LM Studio…).
 */
export class OpenAICompatibleProvider implements AiProvider {
  readonly name = "openai-compatible";

  constructor(private readonly config: ProviderConfig) {}

  private endpoint(path: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    return `${base}${path}`;
  }

  private headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  private body(messages: ChatCompletionMessage[], options: ChatOptions, stream: boolean) {
    return JSON.stringify({
      model: options.model,
      messages,
      stream,
      temperature: options.temperature ?? this.config.temperature,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
    });
  }

  async chat(messages: ChatCompletionMessage[], options: ChatOptions): Promise<string> {
    let response: Response;
    try {
      response = await fetch(this.endpoint("/chat/completions"), {
        method: "POST",
        headers: this.headers(),
        body: this.body(messages, options, false),
        signal: options.signal,
      });
    } catch (error) {
      throw this.networkError(error);
    }

    if (!response.ok) {
      throw await this.httpError(response);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content ?? "";
  }

  async chatStream(
    messages: ChatCompletionMessage[],
    options: ChatOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    let response: Response;
    try {
      response = await fetch(this.endpoint("/chat/completions"), {
        method: "POST",
        headers: this.headers(),
        body: this.body(messages, options, true),
        signal: options.signal,
      });
    } catch (error) {
      throw this.networkError(error);
    }

    if (!response.ok) {
      throw await this.httpError(response);
    }

    if (!response.body) {
      throw new AiProviderError("EMPTY_STREAM", "Provider returned an empty stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    return new ReadableStream<Uint8Array>({
      start(controller) {
        const pump = async () => {
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line.startsWith("data:")) continue;

                const data = line.slice(5).trim();
                if (data === "[DONE]") {
                  controller.close();
                  return;
                }
                if (!data) continue;

                let parsed: StreamChunk;
                try {
                  parsed = JSON.parse(data) as StreamChunk;
                } catch {
                  continue; // Ignore malformed keep-alive fragments.
                }

                if (parsed.error) {
                  controller.error(
                    new AiProviderError(
                      "PROVIDER_STREAM_ERROR",
                      parsed.error.message ?? "Provider stream error.",
                    ),
                  );
                  return;
                }

                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(encoder.encode(delta));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error instanceof Error ? error : new Error(String(error)));
          }
        };

        void pump();
      },
      cancel(reason) {
        void reader.cancel(reason);
      },
    });
  }

  private networkError(error: unknown): AiProviderError {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new AiProviderError("TIMEOUT", "The provider request timed out.", 504);
    }
    return new AiProviderError(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Failed to reach the provider.",
    );
  }

  private async httpError(response: Response): Promise<AiProviderError> {
    let message = `Provider responded with ${response.status}.`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // Non-JSON error body; keep the status-based message.
    }

    if (response.status === 401 || response.status === 403) {
      return new AiProviderError("INVALID_API_KEY", message, 401);
    }
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after")) || undefined;
      return new AiProviderError("RATE_LIMITED", message, 429, retryAfter);
    }
    if (response.status === 404) {
      return new AiProviderError("MODEL_NOT_FOUND", message, 404);
    }
    return new AiProviderError("PROVIDER_ERROR", message, 502);
  }
}
