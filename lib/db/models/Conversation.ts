import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const conversationSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    title: { type: String, required: true, trim: true, default: "New conversation" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", default: null },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    summary: { type: String, default: null },
    importantExcerpts: { type: [String], default: [] },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true },
);

conversationSchema.index({ isArchived: 1, lastMessageAt: -1 });

export type ConversationDoc = InferSchemaType<typeof conversationSchema>;

export const Conversation: Model<ConversationDoc> =
  (models.Conversation as Model<ConversationDoc>) ??
  model<ConversationDoc>("Conversation", conversationSchema);

export default Conversation;
