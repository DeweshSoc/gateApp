import { cache } from "react";
import { connectToDatabase } from "@/lib/db/client";
import { Pyq, Subject } from "@/lib/db/models";
import type { Difficulty, PyqDTO, SubjectDTO } from "@/types";

export interface PyqWorkspaceData {
  questions: PyqDTO[];
  subjects: SubjectDTO[];
}

/**
 * Load the PYQ workspace (questions + subjects) for the server page. Returns
 * empty collections when the database is unavailable or not seeded.
 *
 * Wrapped in React `cache()` to dedupe repeated calls within a single render.
 */
export const loadPyqWorkspace = cache(async (): Promise<PyqWorkspaceData> => {
  try {
    await connectToDatabase();
    const [rows, subjects] = await Promise.all([
      Pyq.find().sort({ year: -1, createdAt: -1 }).limit(300).lean(),
      Subject.find().sort({ order: 1, name: 1 }).lean(),
    ]);

    const questions: PyqDTO[] = rows.map((p) => ({
      id: String(p._id),
      subjectId: p.subjectId ? String(p.subjectId) : null,
      topicId: p.topicId ? String(p.topicId) : null,
      year: p.year,
      question: p.question,
      options: (p.options ?? []).map((o) => ({
        text: o.text,
        isCorrect: Boolean(o.isCorrect),
      })),
      explanation: p.explanation ?? "",
      difficulty: (p.difficulty ?? "medium") as Difficulty,
      isBookmarked: Boolean(p.isBookmarked),
      isVerified: Boolean(p.isVerified),
    }));

    const subjectDTOs: SubjectDTO[] = subjects.map((s) => ({
      id: String(s._id),
      slug: s.slug,
      name: s.name,
      code: s.code,
      color: s.color ?? "#3b82f6",
      description: s.description ?? "",
      order: s.order ?? 0,
    }));

    return { questions, subjects: subjectDTOs };
  } catch {
    return { questions: [], subjects: [] };
  }
});
