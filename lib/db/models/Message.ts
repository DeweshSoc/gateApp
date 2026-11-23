import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";
import { MESSAGE_ROLES } from "@/lib/constants";

const messageSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true },
    summary: { type: String, default: null },
    isImportant: { type: Boolean, default: false },
    tokenCount: { type: Number, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export type MessageDoc = InferSchemaType<typeof messageSchema>;

export const Message: Model<MessageDoc> =
  (models.Message as Model<MessageDoc>) ?? model<MessageDoc>("Message", messageSchema);

export default Message;
