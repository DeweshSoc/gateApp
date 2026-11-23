import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";
import { PROGRESS_STATUSES } from "@/lib/constants";

const progressSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", default: null },
    status: { type: String, enum: PROGRESS_STATUSES, default: "not-started" },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

progressSchema.index({ subjectId: 1, topicId: 1 });

export type ProgressDoc = InferSchemaType<typeof progressSchema>;

export const Progress: Model<ProgressDoc> =
  (models.Progress as Model<ProgressDoc>) ??
  model<ProgressDoc>("Progress", progressSchema);

export default Progress;
