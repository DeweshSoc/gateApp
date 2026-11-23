"use client";

import * as React from "react";
import { GraduationCap, Layers, Sparkles, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiProfileDTO, ChatContextValue, SubjectWithTopics } from "@/types";

/** Radix Select forbids an empty string item value. */
const NONE = "__none__";

interface ChatContextBarProps {
  subjects: SubjectWithTopics[];
  profiles: AiProfileDTO[];
  value: ChatContextValue;
  onChange: (next: ChatContextValue) => void;
  disabled?: boolean;
}

/**
 * Compact pill row that lets the student attach a subject, a topic within that
 * subject, and an AI behaviour profile to the next chat turn. All three are
 * optional; the server falls back to conversation/preference defaults.
 */
export function ChatContextBar({
  subjects,
  profiles,
  value,
  onChange,
  disabled,
}: ChatContextBarProps) {
  const selectedSubject = React.useMemo(
    () => subjects.find((s) => s.id === value.subjectId) ?? null,
    [subjects, value.subjectId],
  );
  const topics = selectedSubject?.topics ?? [];
  const hasContext = Boolean(value.subjectId || value.profileId);

  const setSubject = (next: string) => {
    const subjectId = next === NONE ? null : next;
    const subject = subjects.find((s) => s.id === subjectId) ?? null;
    const topicStillValid =
      subject?.topics.some((t) => t.id === value.topicId) ?? false;
    onChange({
      ...value,
      subjectId,
      topicId: topicStillValid ? value.topicId : null,
    });
  };

  const triggerClass = (active: boolean) =>
    cn(
      "h-7 w-auto gap-1.5 rounded-full px-2.5 text-xs font-medium shadow-none",
      active
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-dashed text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  if (subjects.length === 0 && profiles.length === 0) return null;

  return (
    <div className="mx-auto mb-2 flex w-full max-w-3xl flex-wrap items-center gap-1.5 px-4">
      {subjects.length > 0 && (
        <Select
          value={value.subjectId ?? NONE}
          onValueChange={setSubject}
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass(Boolean(value.subjectId))}>
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Any subject</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {topics.length > 0 && (
        <Select
          value={value.topicId ?? NONE}
          onValueChange={(next) =>
            onChange({ ...value, topicId: next === NONE ? null : next })
          }
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass(Boolean(value.topicId))}>
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>All topics</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {profiles.length > 0 && (
        <Select
          value={value.profileId ?? NONE}
          onValueChange={(next) =>
            onChange({ ...value, profileId: next === NONE ? null : next })
          }
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass(Boolean(value.profileId))}>
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="AI style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Default style</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasContext && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 rounded-full text-muted-foreground"
          onClick={() => onChange({ subjectId: null, topicId: null, profileId: null })}
          disabled={disabled}
          aria-label="Clear study context"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
