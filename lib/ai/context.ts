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
 * Never sends the full history blindly. Linear in `history.length`: the set of
 * retained indices is computed in a single pass (no nested `includes` scans).
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

  const recentStart = Math.max(0, history.length - window);

  // Single pass: mark indices that are important or within the recent window.
  const selected = new Set<number>();
  for (let i = 0; i < history.length; i += 1) {
    const m = history[i];
    if (!m) continue;
    if (m.isImportant || i >= recentStart) selected.add(i);
  }

  // Second pass in chronological order, deduping by role+content.
  const seen = new Set<string>();
  const merged: MessageLike[] = [];
  for (let i = 0; i < history.length; i += 1) {
    if (!selected.has(i)) continue;
    const m = history[i];
    if (!m) continue;
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
