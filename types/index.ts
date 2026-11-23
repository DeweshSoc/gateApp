/**
 * Shared TypeScript types used across client and server.
 * Model interfaces live in `lib/db/models`; these are transport/DTO shapes.
 */

import type { MESSAGE_ROLES, PROGRESS_STATUSES, DIFFICULTIES } from "@/lib/constants";

export type MessageRole = (typeof MESSAGE_ROLES)[number];
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Standard API envelope returned by every route. */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface SubjectDTO {
  id: string;
  slug: string;
  name: string;
  code: string;
  color: string;
  description: string;
  order: number;
}

export interface TopicDTO {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  order: number;
}

/** A subject together with its ordered topic list (used by pickers and grids). */
export interface SubjectWithTopics extends SubjectDTO {
  topics: TopicDTO[];
}

/** Selected study context for a chat turn. Null means "no context". */
export interface ChatContextValue {
  subjectId: string | null;
  topicId: string | null;
  profileId: string | null;
}

export interface ConversationDTO {
  id: string;
  title: string;
  subjectId: string | null;
  topicId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  isImportant: boolean;
  tokenCount: number | null;
  createdAt: string;
}

export interface NoteDTO {
  id: string;
  title: string;
  content: string;
  subjectId: string | null;
  topicId: string | null;
  tags: string[];
  importance: string;
  isFavorite: boolean;
  sourceMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiProviderDTO {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  hasApiKey: boolean;
}

export interface PyqOptionDTO {
  text: string;
  isCorrect: boolean;
}

export interface PyqDTO {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  year: number;
  question: string;
  options: PyqOptionDTO[];
  explanation: string;
  difficulty: Difficulty;
  isBookmarked: boolean;
  isVerified: boolean;
}

/** Result returned after submitting an attempt. */
export interface PyqAttemptResultDTO {
  id: string;
  isCorrect: boolean;
  correctOption: number;
  explanation: string;
}

export interface AiProfileDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  isDefault: boolean;
}

export interface PreferenceDTO {
  theme: "light" | "dark" | "system";
  defaultSubjectId: string | null;
  defaultProfileId: string | null;
  customSystemPrompt: string | null;
  responseStyle: "concise" | "balanced" | "detailed";
  streamingEnabled: boolean;
  contextWindow: number;
}

/** A single chat message sent to the AI provider. */
export interface ChatCompletionMessage {
  role: MessageRole;
  content: string;
}
