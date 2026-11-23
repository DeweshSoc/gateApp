import { BookOpen } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { loadSubjectsWithTopics } from "@/lib/server/subjects";
import { SubjectsGrid } from "@/components/subjects/subjects-grid";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Subjects" };
export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const subjects = await loadSubjectsWithTopics();

  return (
    <PageShell
      title="Subjects"
      description="The official GATE CSE syllabus, organized by subject and topic."
    >
      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects seeded"
          description="Run pnpm seed to load the GATE CSE syllabus, or add subjects from the database."
        />
      ) : (
        <SubjectsGrid subjects={subjects} />
      )}
    </PageShell>
  );
}
