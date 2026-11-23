import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const aiProfileSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    systemPrompt: { type: String, required: true },
    temperature: { type: Number, default: 0.4 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type AiProfileDoc = InferSchemaType<typeof aiProfileSchema>;

export const AiProfile: Model<AiProfileDoc> =
  (models.AiProfile as Model<AiProfileDoc>) ??
  model<AiProfileDoc>("AiProfile", aiProfileSchema);

export default AiProfile;
