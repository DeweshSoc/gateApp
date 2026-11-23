import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const aiProviderSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    name: { type: String, required: true, trim: true },
    baseUrl: { type: String, required: true, trim: true },
    apiKeyEncrypted: { type: String, required: true },
    model: { type: String, required: true, trim: true },
    temperature: { type: Number, default: 0.4 },
    maxTokens: { type: Number, default: 2048 },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type AiProviderDoc = InferSchemaType<typeof aiProviderSchema>;

export const AiProvider: Model<AiProviderDoc> =
  (models.AiProvider as Model<AiProviderDoc>) ??
  model<AiProviderDoc>("AiProvider", aiProviderSchema);

export default AiProvider;
