import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";
import { RESPONSE_STYLES, DEFAULT_CONTEXT_WINDOW } from "@/lib/constants";

const preferenceSchema = new Schema(
  {
    userId: { type: String, index: true, unique: true, default: "singleton" },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    defaultSubjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    defaultProfileId: { type: Schema.Types.ObjectId, ref: "AiProfile", default: null },
    customSystemPrompt: { type: String, default: null },
    responseStyle: { type: String, enum: RESPONSE_STYLES, default: "balanced" },
    streamingEnabled: { type: Boolean, default: true },
    contextWindow: { type: Number, default: DEFAULT_CONTEXT_WINDOW },
  },
  { timestamps: true },
);

export type PreferenceDoc = InferSchemaType<typeof preferenceSchema>;

export const Preference: Model<PreferenceDoc> =
  (models.Preference as Model<PreferenceDoc>) ??
  model<PreferenceDoc>("Preference", preferenceSchema);

export default Preference;
