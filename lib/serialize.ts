import type {
  ConversationDTO,
  MessageDTO,
  SubjectDTO,
  TopicDTO,
  NoteDTO,
  AiProviderDTO,
  AiProfileDTO,
} from "@/types";

/** Structural shape of a lean Mongoose document with `_id`/timestamps. */
interface LeanDoc {
  _id: unknown;
  [key: string]: unknown;
}

function id(value: unknown): string {
  return value == null ? "" : String(value);
}

function iso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toConversationDTO(doc: LeanDoc): ConversationDTO {
  return {
    id: id(doc._id),
    title: String(doc.title ?? "Untitled"),
    subjectId: doc.subjectId ? id(doc.subjectId) : null,
    topicId: doc.topicId ? id(doc.topicId) : null,
    isPinned: Boolean(doc.isPinned),
    isArchived: Boolean(doc.isArchived),
    messageCount: Number(doc.messageCount ?? 0),
    lastMessageAt: iso(doc.lastMessageAt),
    createdAt: iso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function toMessageDTO(doc: LeanDoc): MessageDTO {
  return {
    id: id(doc._id),
    conversationId: id(doc.conversationId),
    role: (doc.role as MessageDTO["role"]) ?? "user",
    content: String(doc.content ?? ""),
    isImportant: Boolean(doc.isImportant),
    tokenCount: doc.tokenCount == null ? null : Number(doc.tokenCount),
    createdAt: iso(doc.createdAt) ?? new Date().toISOString(),
  };
}

export function toSubjectDTO(doc: LeanDoc): SubjectDTO {
  return {
    id: id(doc._id),
    slug: String(doc.slug ?? ""),
    name: String(doc.name ?? ""),
    code: String(doc.code ?? ""),
    color: String(doc.color ?? "#3b82f6"),
    description: String(doc.description ?? ""),
    order: Number(doc.order ?? 0),
  };
}

export function toTopicDTO(doc: LeanDoc): TopicDTO {
  return {
    id: id(doc._id),
    subjectId: id(doc.subjectId),
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    order: Number(doc.order ?? 0),
  };
}

export function toNoteDTO(doc: LeanDoc): NoteDTO {
  return {
    id: id(doc._id),
    title: String(doc.title ?? ""),
    content: String(doc.content ?? ""),
    subjectId: doc.subjectId ? id(doc.subjectId) : null,
    topicId: doc.topicId ? id(doc.topicId) : null,
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
    importance: String(doc.importance ?? "medium"),
    isFavorite: Boolean(doc.isFavorite),
    sourceMessageId: doc.sourceMessageId ? id(doc.sourceMessageId) : null,
    createdAt: iso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function toProviderDTO(doc: LeanDoc): AiProviderDTO {
  return {
    id: id(doc._id),
    name: String(doc.name ?? ""),
    baseUrl: String(doc.baseUrl ?? ""),
    model: String(doc.model ?? ""),
    temperature: Number(doc.temperature ?? 0.4),
    maxTokens: Number(doc.maxTokens ?? 2048),
    isActive: Boolean(doc.isActive),
    hasApiKey: Boolean(doc.apiKeyEncrypted),
  };
}

export function toProfileDTO(doc: LeanDoc): AiProfileDTO {
  return {
    id: id(doc._id),
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    description: String(doc.description ?? ""),
    systemPrompt: String(doc.systemPrompt ?? ""),
    temperature: Number(doc.temperature ?? 0.4),
    isDefault: Boolean(doc.isDefault),
  };
}
