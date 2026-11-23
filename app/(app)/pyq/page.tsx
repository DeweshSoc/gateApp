import { FileQuestion } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { PyqWorkspace } from "@/components/pyq/pyq-workspace";
import { loadPyqWorkspace } from "@/lib/server/pyqs";

export const metadata = { title: "Previous Year Questions" };
export const dynamic = "force-dynamic";

export default async function PyqPage() {
  const data = await loadPyqWorkspace();

  return (
    <PageShell
      title="Previous Year Questions"
      description="Practice GATE CSE PYQs with instant scoring, explanations, and bookmarking."
    >
      {data.questions.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No questions yet"
          description="PYQs you add to the database will appear here for practice."
        />
      ) : (
        <PyqWorkspace initial={data} />
      )}
    </PageShell>
  );
}
