"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComposerProps {
  onSubmit: (value: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function Composer({
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  placeholder = "Ask anything about GATE CSE…",
  autoFocus,
}: ComposerProps) {
  const [value, setValue] = React.useState("");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const resize = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  React.useEffect(resize, [value, resize]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSubmit(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      resize();
      ref.current?.focus();
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        )}
      >
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={1}
          disabled={disabled}
          className="max-h-[200px] min-h-[38px] resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={onStop}
            aria-label="Stop generating"
            className="shrink-0 rounded-lg"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            className="shrink-0 rounded-lg"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-1.5 text-center text-[0.7rem] text-muted-foreground">
        GATE Mentor can make mistakes. Verify exam-specific facts.
      </p>
    </div>
  );
}
