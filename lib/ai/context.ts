import type { ChatCompletionMessage } from "@/types";
import { DEFAULT_CONTEXT_WINDOW } from "@/lib/constants";

interface MessageLike {
  role: string;
  content: string;
  isImportant?: boolean;
}

/**
 * Build the active context sent to the provider:
 * - system prompt first,
 * - important (flagged) messages always retained,
 * - rolling summary if older messages were compacted,
 * - the last N messages.
 *
 * Never sends the full history blindly.
 */
export function buildActiveContext(options: {
  systemPrompt: string;
  history: MessageLike[];
  summary?: string | null;
  contextWindow?: number;
}): ChatCompletionMessage[] {
  const { systemPrompt, history, summary } = options;
  const window = options.contextWindow ?? DEFAULT_CONTEXT_WINDOW;

  const messages: ChatCompletionMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  const important = history.filter((m) => m.isImportant);
  const recent = history.slice(-window);

  // Union of important + recent, preserving chronological order.
  const seen = new Set<string>();
  const merged: MessageLike[] = [];
  for (const m of history) {
    const isImportant = important.includes(m);
    const isRecent = recent.includes(m);
    if (!isImportant && !isRecent) continue;
    const key = `${m.role}:${m.content}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(m);
  }

  if (summary && summary.trim()) {
    messages.push({
      role: "system",
      content: `Summary of earlier conversation:\n${summary.trim()}`,
    });
  }

  for (const m of merged) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: m.content });
    }
  }

  return messages;
}

/**
 * Naive token estimate (~4 chars/token). Used only for lightweight budgeting,
 * never for billing.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
