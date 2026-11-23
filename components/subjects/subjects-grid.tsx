"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, MessageSquarePlus } from "lucide-react";
import type { SubjectWithTopics } from "@/lib/server/subjects";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SubjectsGrid({ subjects }: { subjects: SubjectWithTopics[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {subjects.map((subject) => (
        <SubjectCard key={subject.id} subject={subject} />
      ))}
    </div>
  );
}

function SubjectCard({ subject }: { subject: SubjectWithTopics }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 h-8 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{subject.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{subject.code}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/chat?subject=${subject.id}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Start a chat about ${subject.name}`}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Toggle topics"
            aria-expanded={open}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {subject.description || "No description."}
        </p>

        <Badge variant="secondary">{subject.topics.length} topics</Badge>

        {open && subject.topics.length > 0 && (
          <ul className="mt-3 space-y-1 border-t pt-3">
            {subject.topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/chat?subject=${subject.id}&topic=${topic.id}`}
                  className="block rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {topic.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
