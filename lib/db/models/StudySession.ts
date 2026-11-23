import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const studySessionSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    date: { type: Date, required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    durationMinutes: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type StudySessionDoc = InferSchemaType<typeof studySessionSchema>;

export const StudySession: Model<StudySessionDoc> =
  (models.StudySession as Model<StudySessionDoc>) ??
  model<StudySessionDoc>("StudySession", studySessionSchema);

export default StudySession;
