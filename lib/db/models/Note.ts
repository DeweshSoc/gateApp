import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";
import { IMPORTANCE_LEVELS } from "@/lib/constants";

const noteSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", default: null },
    tags: { type: [String], default: [] },
    importance: { type: String, enum: IMPORTANCE_LEVELS, default: "medium" },
    isFavorite: { type: Boolean, default: false },
    sourceMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { timestamps: true },
);

noteSchema.index({ title: "text", content: "text", tags: "text" });

export type NoteDoc = InferSchemaType<typeof noteSchema>;

export const Note: Model<NoteDoc> =
  (models.Note as Model<NoteDoc>) ?? model<NoteDoc>("Note", noteSchema);

export default Note;
