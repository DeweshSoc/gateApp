import { cache } from "react";
import { connectToDatabase } from "@/lib/db/client";
import { Subject, Topic } from "@/lib/db/models";
import type { SubjectWithTopics, TopicDTO } from "@/types";

export type { SubjectWithTopics };

/**
 * Load all subjects with their topics for the subjects page. Returns an empty
 * array when the database is unavailable or not seeded.
 *
 * Wrapped in React `cache()` so multiple calls within the same request/render
 * (e.g. page + chat view) share a single database round-trip.
 */
export const loadSubjectsWithTopics = cache(
  async (): Promise<SubjectWithTopics[]> => {
    try {
      await connectToDatabase();
      const [subjects, topics] = await Promise.all([
        Subject.find().sort({ order: 1, name: 1 }).lean(),
        Topic.find().sort({ order: 1, name: 1 }).lean(),
      ]);

      const topicsBySubject = new Map<string, TopicDTO[]>();
      for (const topic of topics) {
        const key = String(topic.subjectId);
        const list = topicsBySubject.get(key) ?? [];
        list.push({
          id: String(topic._id),
          subjectId: key,
          name: topic.name,
          slug: topic.slug,
          order: topic.order ?? 0,
        });
        topicsBySubject.set(key, list);
      }

      return subjects.map((s) => {
        const id = String(s._id);
        return {
          id,
          slug: s.slug,
          name: s.name,
          code: s.code,
          color: s.color ?? "#3b82f6",
          description: s.description ?? "",
          order: s.order ?? 0,
          topics: topicsBySubject.get(id) ?? [],
        };
      });
    } catch {
      return [];
    }
  },
);
