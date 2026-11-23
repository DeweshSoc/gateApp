import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const topicSchema = new Schema(
  {
    userId: { type: String, index: true, default: null },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

topicSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

export type TopicDoc = InferSchemaType<typeof topicSchema>;

export const Topic: Model<TopicDoc> =
  (models.Topic as Model<TopicDoc>) ?? model<TopicDoc>("Topic", topicSchema);

export default Topic;
