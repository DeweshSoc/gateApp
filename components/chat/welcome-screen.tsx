"use client";

import { BookOpen, Brain, Code2, Sigma } from "lucide-react";
import { Composer } from "./composer";

const SUGGESTIONS = [
  {
    icon: Sigma,
    title: "Explain a concept",
    prompt: "Explain the pumping lemma for regular languages with an example.",
  },
  {
    icon: Code2,
    title: "Trace an algorithm",
    prompt: "Walk through Dijkstra's algorithm on a small weighted graph, step by step.",
  },
  {
    icon: Brain,
    title: "Solve a problem",
    prompt: "A process uses 4 frames and the reference string 1,2,3,4,1,2,5,1,2,3,4,5. Compute FIFO page faults.",
  },
  {
    icon: BookOpen,
    title: "Revise quickly",
    prompt: "Give me a concise revision sheet for normalization (1NF through BCNF).",
  },
];

interface WelcomeScreenProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function WelcomeScreen({ onSubmit, disabled }: WelcomeScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">How can I help you prepare?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ask about any GATE CSE topic — concepts, problems, PYQs, or revision plans.
        </p>
      </div>

      <div className="mb-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onSubmit(s.prompt)}
            disabled={disabled}
            className="group flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <s.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{s.title}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                {s.prompt}
              </span>
            </span>
          </button>
        ))}
      </div>

      <Composer onSubmit={onSubmit} disabled={disabled} autoFocus />
    </div>
  );
}
