import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const subjectSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    color: { type: String, default: "#3b82f6" },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type SubjectDoc = InferSchemaType<typeof subjectSchema>;

export const Subject: Model<SubjectDoc> =
  (models.Subject as Model<SubjectDoc>) ?? model<SubjectDoc>("Subject", subjectSchema);

export default Subject;
