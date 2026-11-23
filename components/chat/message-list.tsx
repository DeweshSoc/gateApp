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

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streamingContent]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div key={message.id} className="animate-fade-in">
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
      })}

      {isStreaming && streamingContent !== undefined && (
        <StreamingBubble content={streamingContent} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Bot className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">GATE Mentor</span>
      </div>
      <div className="pl-8">
        {content ? (
          <MarkdownRenderer content={content} />
        ) : (
          <span className="inline-flex gap-1 py-1">
            <Dot delay="0ms" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </span>
        )}
        {content && (
          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-foreground align-middle" />
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  );
}
