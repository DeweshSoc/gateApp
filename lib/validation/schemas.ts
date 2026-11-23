import { z } from "zod";
import {
  MESSAGE_ROLES,
  PROGRESS_STATUSES,
  DIFFICULTIES,
  RESPONSE_STYLES,
  IMPORTANCE_LEVELS,
} from "@/lib/constants";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid id.");

export const chatRequestSchema = z.object({
  conversationId: objectId.optional(),
  message: z.string().trim().min(1, "Message cannot be empty.").max(32_000),
  providerId: objectId.optional(),
  profileId: objectId.optional(),
  subjectId: objectId.optional(),
  topicId: objectId.optional(),
  stream: z.boolean().optional(),
});

export const createConversationSchema = z.object({
  title: z.string().trim().max(160).optional(),
  subjectId: objectId.nullish(),
  topicId: objectId.nullish(),
});

export const updateConversationSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  subjectId: objectId.nullish(),
  topicId: objectId.nullish(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const createMessageSchema = z.object({
  conversationId: objectId,
  role: z.enum(MESSAGE_ROLES),
  content: z.string().min(1),
  isImportant: z.boolean().optional(),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  content: z.string().min(1, "Content is required."),
  subjectId: objectId.nullish(),
  topicId: objectId.nullish(),
  tags: z.array(z.string().trim()).max(20).optional(),
  importance: z.enum(IMPORTANCE_LEVELS).optional(),
  isFavorite: z.boolean().optional(),
  sourceMessageId: objectId.nullish(),
});

export const updateNoteSchema = noteSchema.partial();

export const providerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  baseUrl: z.string().url("Must be a valid URL."),
  apiKey: z.string().min(1, "API key is required.").optional(),
  model: z.string().trim().min(1, "Model is required."),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(32_000).optional(),
  isActive: z.boolean().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().max(400).optional(),
  systemPrompt: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  isDefault: z.boolean().optional(),
});

export const preferenceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  defaultSubjectId: objectId.nullish(),
  defaultProfileId: objectId.nullish(),
  customSystemPrompt: z.string().nullable().optional(),
  responseStyle: z.enum(RESPONSE_STYLES).optional(),
  streamingEnabled: z.boolean().optional(),
  contextWindow: z.number().int().min(2).max(50).optional(),
});

export const progressSchema = z.object({
  subjectId: objectId.nullish(),
  topicId: objectId.nullish(),
  status: z.enum(PROGRESS_STATUSES),
  note: z.string().max(2000).nullish(),
});

export const pyqSchema = z.object({
  subjectId: objectId.nullish(),
  topicId: objectId.nullish(),
  year: z.number().int().min(1990).max(2100),
  question: z.string().min(1),
  options: z
    .array(z.object({ text: z.string().min(1), isCorrect: z.boolean() }))
    .min(2)
    .max(6),
  explanation: z.string().optional(),
  source: z.string().optional(),
  isVerified: z.boolean().optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  isBookmarked: z.boolean().optional(),
});

export const attemptSchema = z.object({
  pyqId: objectId,
  selectedOption: z.number().int().min(0).max(5),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1, "Search query is required."),
  limit: z.number().int().min(1).max(50).optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
