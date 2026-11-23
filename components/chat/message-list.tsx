"use client";

import * as React from "react";
import { Bot, GraduationCap } from "lucide-react";
import type { MessageDTO } from "@/types";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { MessageActions } from "./message-actions";

interface MessageListProps {
  messages: MessageDTO[];
  streamingContent?: string;
  isStreaming?: boolean;
  onToggleImportant?: (id: string, next: boolean) => void;
}

export function MessageList({
  messages,
  streamingContent,
  isStreaming,
  onToggleImportant,
}: MessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages, and while streaming (but not on every token;
  // streamingContent changes drive a cheap layout-only scroll below).
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {messages.map((message) => (
        <MemoMessageRow
          key={message.id}
          message={message}
          onToggleImportant={onToggleImportant}
        />
      ))}

      {isStreaming && streamingContent !== undefined && (
        <StreamingBubble content={streamingContent} bottomRef={bottomRef} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}

interface MessageRowProps {
  message: MessageDTO;
  onToggleImportant?: (id: string, next: boolean) => void;
}

/** Completed message row. Memoized so streaming tokens never re-render history. */
const MessageRow = React.memo(function MessageRow({
  message,
  onToggleImportant,
}: MessageRowProps) {
  const isUser = message.role === "user";
  return (
    <div className="animate-fade-in">
      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-[0.7rem] font-semibold",
            isUser
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          {isUser ? <GraduationCap className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {isUser ? "You" : "GATE Mentor"}
        </span>
      </div>

      <div className="pl-8">
        {isUser ? (
          <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-7">
            {message.content}
          </p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}

        <MessageActions
          content={message.content}
          messageId={message.id}
          isImportant={message.isImportant}
          onToggleImportant={(next) => onToggleImportant?.(message.id, next)}
          className="mt-1 -ml-2 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100"
        />
      </div>
    </div>
  );
});

const MemoMessageRow = MessageRow;

function StreamingBubble({
  content,
  bottomRef,
}: {
  content: string;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Throttle expensive Markdown re-parsing to ~10fps while tokens stream in.
  const throttled = useThrottledValue(content, 100);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [throttled, bottomRef]);

  return (
    <div className="animate-fade-in">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Bot className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">GATE Mentor</span>
      </div>
      <div className="pl-8">
        {throttled ? (
          <MarkdownRenderer content={throttled} />
        ) : (
          <span className="inline-flex gap-1 py-1">
            <Dot delay="0ms" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </span>
        )}
        {throttled && (
          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-foreground align-middle" />
        )}
      </div>
    </div>
  );
}

/** Returns `value` but updates at most once per `intervalMs`. */
function useThrottledValue<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = React.useState(value);
  const lastRun = React.useRef(0);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const now = Date.now();
    const remaining = intervalMs - (now - lastRun.current);

    if (remaining <= 0) {
      lastRun.current = now;
      setThrottled(value);
      return;
    }

    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      lastRun.current = Date.now();
      setThrottled(value);
      timeout.current = null;
    }, remaining);

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
    };
  }, [value, intervalMs]);

  return throttled;
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  );
}
