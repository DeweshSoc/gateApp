"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  XCircle,
} from "lucide-react";
import type {
  PyqAttemptResultDTO,
  PyqDTO,
  SubjectDTO,
} from "@/types";
import type { PyqWorkspaceData } from "@/lib/server/pyqs";
import { apiFetch, invalidateApiCache } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

const ALL = "__all__";
/** Number of question cards mounted initially and added per "load more" step. */
const PAGE_SIZE = 30;

type FilterKey = "all" | "unattempted" | "incorrect" | "bookmarked";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unattempted", label: "Not attempted" },
  { key: "incorrect", label: "Incorrect" },
  { key: "bookmarked", label: "Bookmarked" },
];

export function PyqWorkspace({ initial }: { initial: PyqWorkspaceData }) {
  const [questions, setQuestions] = React.useState<PyqDTO[]>(initial.questions);
  const [loading] = React.useState(false);
  const [subjectId, setSubjectId] = React.useState<string>(ALL);
  const [year, setYear] = React.useState<string>(ALL);
  const [filter, setFilter] = React.useState<FilterKey>("all");

  /** questionId → attempt result (persisted for the session). */
  const [results, setResults] = React.useState<Record<string, PyqAttemptResultDTO>>({});
  /** questionId → chosen option index awaiting submission. */
  const [selections, setSelections] = React.useState<Record<string, number>>({});
  const [submitting, setSubmitting] = React.useState<string | null>(null);

  const subjectsById = React.useMemo(() => {
    const map = new Map<string, SubjectDTO>();
    for (const s of initial.subjects) map.set(s.id, s);
    return map;
  }, [initial.subjects]);

  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const q of questions) set.add(q.year);
    return Array.from(set).sort((a, b) => b - a);
  }, [questions]);

  const filtered = React.useMemo(() => {
    return questions.filter((q) => {
      if (subjectId !== ALL && q.subjectId !== subjectId) return false;
      if (year !== ALL && String(q.year) !== year) return false;
      const result = results[q.id];
      if (filter === "unattempted") return !result;
      if (filter === "incorrect") return Boolean(result && !result.isCorrect);
      if (filter === "bookmarked") return q.isBookmarked;
      return true;
    });
  }, [questions, subjectId, year, filter, results]);

  const refreshQuestions = React.useCallback(async () => {
    try {
      const data = await apiFetch<PyqDTO[]>("/api/pyqs", { noCache: true });
      setQuestions(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh questions.");
    }
  }, []);

  // Progressive rendering: mount the first PAGE_SIZE questions and grow the
  // window as the user scrolls, so a large bank never mounts hundreds of
  // Markdown-rendered cards at once.
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const sentinelRef = React.useRef<HTMLLIElement>(null);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const submitAttempt = async (question: PyqDTO) => {
    const selected = selections[question.id];
    if (typeof selected !== "number") return;

    setSubmitting(question.id);
    try {
      const result = await apiFetch<PyqAttemptResultDTO>("/api/pyqs/attempts", {
        method: "POST",
        body: JSON.stringify({ pyqId: question.id, selectedOption: selected }),
      });
      setResults((prev) => ({ ...prev, [question.id]: result }));
      toast[result.isCorrect ? "success" : "error"](
        result.isCorrect ? "Correct!" : "Not quite — review the explanation.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit attempt.");
    } finally {
      setSubmitting(null);
    }
  };

  const resetAttempt = (id: string) => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelections((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleBookmark = async (question: PyqDTO) => {
    const next = !question.isBookmarked;
    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? { ...q, isBookmarked: next } : q)),
    );
    try {
      await apiFetch(`/api/pyqs/${question.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isBookmarked: next }),
      });
      invalidateApiCache("/api/pyqs");
    } catch (error) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === question.id ? { ...q, isBookmarked: question.isBookmarked } : q,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Failed to update bookmark.");
    }
  };

  const attempted = Object.keys(results).length;
  const correct = Object.values(results).filter((r) => r.isCorrect).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All subjects</SelectItem>
            {initial.subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 rounded-md border p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {attempted} attempted · {correct} correct
            {attempted > 0 && ` (${Math.round((correct / attempted) * 100)}%)`}
          </span>
          <Button variant="ghost" size="sm" onClick={refreshQuestions}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm font-medium">No questions match these filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add PYQs from the database, or relax the filters above.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.slice(0, visibleCount).map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index + 1}
              subject={question.subjectId ? subjectsById.get(question.subjectId) : undefined}
              result={results[question.id]}
              selected={selections[question.id]}
              submitting={submitting === question.id}
              onSelect={(option) =>
                setSelections((prev) => ({ ...prev, [question.id]: option }))
              }
              onSubmit={() => submitAttempt(question)}
              onReset={() => resetAttempt(question.id)}
              onToggleBookmark={() => toggleBookmark(question)}
            />
          ))}
          {visibleCount < filtered.length && (
            <li ref={sentinelRef} className="py-4 text-center text-xs text-muted-foreground">
              Loading more…
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: PyqDTO;
  index: number;
  subject?: SubjectDTO;
  result?: PyqAttemptResultDTO;
  selected?: number;
  submitting: boolean;
  onSelect: (option: number) => void;
  onSubmit: () => void;
  onReset: () => void;
  onToggleBookmark: () => void;
}

function QuestionCard({
  question,
  index,
  subject,
  result,
  selected,
  submitting,
  onSelect,
  onSubmit,
  onReset,
  onToggleBookmark,
}: QuestionCardProps) {
  const answered = Boolean(result);
  const correctOption = result?.correctOption ?? -1;

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Q{index}</span>
        <Badge variant="outline">{question.year}</Badge>
        {subject && (
          <Badge variant="secondary" className="gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: subject.color }}
            />
            {subject.code}
          </Badge>
        )}
        <Badge
          variant={
            question.difficulty === "easy"
              ? "success"
              : question.difficulty === "hard"
                ? "destructive"
                : "warning"
          }
        >
          {question.difficulty}
        </Badge>
        {question.isVerified && <Badge variant="default">verified</Badge>}

        <button
          type="button"
          onClick={onToggleBookmark}
          className={cn(
            "ml-auto rounded p-1 text-muted-foreground hover:text-foreground",
            question.isBookmarked && "text-amber-500",
          )}
          aria-label={question.isBookmarked ? "Remove bookmark" : "Bookmark question"}
        >
          {question.isBookmarked ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      <MarkdownRenderer content={question.question} className="text-sm" />

      <div className="mt-3 space-y-1.5">
        {question.options.map((option, optionIndex) => {
          const isSelected = selected === optionIndex;
          const isCorrect = answered && optionIndex === correctOption;
          const isWrongPick = answered && isSelected && optionIndex !== correctOption;

          return (
            <label
              key={optionIndex}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                !answered && isSelected && "border-primary bg-primary/5",
                !answered && !isSelected && "hover:bg-accent",
                isCorrect && "border-emerald-500/60 bg-emerald-500/10",
                isWrongPick && "border-destructive/60 bg-destructive/10",
                answered && !isCorrect && !isWrongPick && "opacity-70",
              )}
            >
              <input
                type="radio"
                name={`pyq-${question.id}`}
                value={optionIndex}
                checked={isSelected}
                disabled={answered}
                onChange={() => onSelect(optionIndex)}
                className="mt-1 h-3.5 w-3.5 shrink-0 accent-[hsl(var(--primary))]"
              />
              <span className="flex-1">
                <span className="mr-1.5 font-medium">
                  {String.fromCharCode(65 + optionIndex)}.
                </span>
                {option.text}
              </span>
              {isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
              {isWrongPick && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!answered ? (
          <Button size="sm" onClick={onSubmit} disabled={selected === undefined || submitting}>
            {submitting ? "Checking…" : "Submit answer"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
        )}
        {answered && (
          <span
            className={cn(
              "text-sm font-medium",
              result?.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {result?.isCorrect ? "Correct" : "Incorrect"}
          </span>
        )}
      </div>

      {answered && result?.explanation && (
        <div className="mt-3 rounded-md bg-muted/50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Explanation
          </p>
          <MarkdownRenderer content={result.explanation} className="text-sm" />
        </div>
      )}
    </li>
  );
}
