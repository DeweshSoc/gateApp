/**
 * Application-wide constants and enumerations.
 */

export const APP_NAME = "GATE 2027 AI";
export const APP_DESCRIPTION =
  "A personalized GATE 2027 CSE research and learning companion.";

/** Default number of recent messages included in the active AI context. */
export const DEFAULT_CONTEXT_WINDOW = 12;

/** Fallbacks used only when no active provider is configured. */
export const DEFAULT_AI_MODEL = "gpt-4o-mini";
export const DEFAULT_TEMPERATURE = 0.4;
export const DEFAULT_MAX_TOKENS = 2048;

export const MESSAGE_ROLES = ["user", "assistant", "system"] as const;

export const PROGRESS_STATUSES = [
  "not-started",
  "in-progress",
  "completed",
  "to-revise",
] as const;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const RESPONSE_STYLES = [
  "concise",
  "balanced",
  "detailed",
] as const;

export const IMPORTANCE_LEVELS = ["low", "medium", "high"] as const;

/** Navigation entries rendered in the sidebar. */
export const NAV_ITEMS = [
  { href: "/chat", label: "Chat", icon: "MessageSquare" },
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/subjects", label: "Subjects", icon: "BookOpen" },
  { href: "/notes", label: "Notes", icon: "NotebookPen" },
  { href: "/pyq", label: "PYQ Workspace", icon: "FileQuestion" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
