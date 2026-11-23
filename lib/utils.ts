import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names, resolving Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for conversation lists: relative for recent, absolute otherwise.
 */
export function formatRelativeDate(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

/**
 * Truncate a string to a maximum length, appending an ellipsis when trimmed.
 */
export function truncate(value: string, max = 80): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}\u2026`;
}

/**
 * Derive a conversation title from the first user message.
 */
export function deriveTitle(content: string, max = 60): string {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length === 0 ? "New conversation" : truncate(clean, max);
}

/**
 * Coerce an unknown thrown value into a readable message.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

/**
 * Simple slugify for subjects, topics, and profiles.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
