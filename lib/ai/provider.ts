import type { ChatCompletionMessage } from "@/types";

/** Options passed to a chat completion call. */
export interface ChatOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  /** Abort signal to support timeouts and client disconnects. */
  signal?: AbortSignal;
}

/** Configuration required to construct a provider adapter. */
export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Provider-agnostic interface. Any OpenAI-compatible endpoint is supported via
 * `OpenAICompatibleProvider`; additional providers implement the same contract.
 */
export interface AiProvider {
  readonly name: string;
  /** Stream chat completion deltas as a ReadableStream of text chunks. */
  chatStream(messages: ChatCompletionMessage[], options: ChatOptions): Promise<ReadableStream<Uint8Array>>;
  /** Non-streaming completion, returns the full assistant message. */
  chat(messages: ChatCompletionMessage[], options: ChatOptions): Promise<string>;
}

/** Standardized AI error with a machine-readable code. */
export class AiProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 502,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
