import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";
import { DIFFICULTIES } from "@/lib/constants";

const optionSchema = new Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false },
);

const pyqSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", default: null },
    year: { type: Number, required: true, index: true },
    question: { type: String, required: true },
    options: { type: [optionSchema], default: [] },
    explanation: { type: String, default: "" },
    source: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    difficulty: { type: String, enum: DIFFICULTIES, default: "medium" },
    isBookmarked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

pyqSchema.index({ year: 1, subjectId: 1 });

export type PyqDoc = InferSchemaType<typeof pyqSchema>;

export const Pyq: Model<PyqDoc> =
  (models.Pyq as Model<PyqDoc>) ?? model<PyqDoc>("Pyq", pyqSchema);

export default Pyq;
