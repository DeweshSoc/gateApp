import { NotebookPen } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { NotesBoard } from "@/components/notes/notes-board";

export const metadata = { title: "Notes" };
export const dynamic = "force-dynamic";

export default function NotesPage() {
  return (
    <PageShell
      title="Notes"
      description="Your personal GATE knowledge base — capture insights and revisable concepts."
    >
      <NotesBoard
        emptyState={
          <EmptyState
            icon={NotebookPen}
            title="No notes yet"
            description="Save important explanations from chats or write your own revision notes."
          />
        }
      />
    </PageShell>
  );
}
