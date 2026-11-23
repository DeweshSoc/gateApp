"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Star, Trash2 } from "lucide-react";
import type { NoteDTO } from "@/types";
import { apiFetch, invalidateApiCache } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function NotesBoard({ emptyState }: { emptyState: React.ReactNode }) {
  const [notes, setNotes] = React.useState<NoteDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [composing, setComposing] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiFetch<NoteDTO[]>("/api/notes")
      .then(setNotes)
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Failed to load notes."),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setSaving(true);
    try {
      const note = await apiFetch<NoteDTO>("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      invalidateApiCache("/api/notes");
      setNotes((prev) => [note, ...prev]);
      setTitle("");
      setContent("");
      setComposing(false);
      toast.success("Note saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
      invalidateApiCache("/api/notes");
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete note.");
    }
  };

  const toggleFavorite = async (note: NoteDTO) => {
    try {
      const updated = await apiFetch<NoteDTO>(`/api/notes/${note.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isFavorite: !note.isFavorite }),
      });
      invalidateApiCache("/api/notes");
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update note.");
    }
  };

  return (
    <div className="space-y-4">
      {composing ? (
        <div className="space-y-2 rounded-lg border p-3">
          <Input
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            placeholder="Write your note in Markdown…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setComposing(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Save note"}
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setComposing(true)}>
          <Plus className="h-4 w-4" /> New note
        </Button>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        emptyState
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <div key={note.id} className="group rounded-lg border p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-medium">{note.title}</p>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(note)}
                    className={cn(
                      "rounded p-1 text-muted-foreground hover:text-foreground",
                      note.isFavorite && "text-amber-500",
                    )}
                    aria-label="Favorite"
                  >
                    <Star className={cn("h-3.5 w-3.5", note.isFavorite && "fill-current")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                {note.content}
              </p>
              {note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
