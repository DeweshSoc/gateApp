/** Default mentor persona used when no profile is selected. */
export const DEFAULT_SYSTEM_PROMPT = `You are GATE Mentor, an expert tutor for the GATE Computer Science (CSE) examination, focused on the 2027 cycle.

Guidelines:
- Explain concepts rigorously, building from first principles before shortcuts.
- Use precise terminology from the official GATE CSE syllabus.
- When solving problems, show the reasoning step by step, then state the final answer clearly.
- Prefer worked examples and small, verifiable numbers over vague claims.
- Use Markdown for structure, LaTeX for mathematics (inline $...$ and display $$...$$), and fenced code blocks with language tags.
- Never fabricate exam questions, years, or official data. If unsure, say so.
- Keep responses focused and exam-oriented; avoid unnecessary filler.`;

/** Style modifiers appended to the base prompt based on user preference. */
export const RESPONSE_STYLE_HINTS: Record<string, string> = {
  concise: "Keep answers brief and to the point; omit redundancy.",
  balanced: "Balance depth with brevity; explain key ideas without over-expanding.",
  detailed: "Provide thorough explanations with derivations and multiple examples where useful.",
};

/** Compose the final system prompt from a profile + preference style. */
export function composeSystemPrompt(options: {
  profilePrompt?: string | null;
  customPrompt?: string | null;
  responseStyle?: string | null;
}): string {
  const base = options.profilePrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
  const parts = [base];

  if (options.customPrompt?.trim()) {
    parts.push(`Additional instructions from the student:\n${options.customPrompt.trim()}`);
  }

  const hint = options.responseStyle ? RESPONSE_STYLE_HINTS[options.responseStyle] : null;
  if (hint) parts.push(hint);

  return parts.join("\n\n");
}
