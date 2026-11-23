import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const pyqAttemptSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    pyqId: { type: Schema.Types.ObjectId, ref: "Pyq", required: true, index: true },
    selectedOption: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type PyqAttemptDoc = InferSchemaType<typeof pyqAttemptSchema>;

export const PyqAttempt: Model<PyqAttemptDoc> =
  (models.PyqAttempt as Model<PyqAttemptDoc>) ??
  model<PyqAttemptDoc>("PyqAttempt", pyqAttemptSchema);

export default PyqAttempt;
