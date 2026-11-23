"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Copy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  content: string;
  messageId?: string;
  isImportant?: boolean;
  onToggleImportant?: (next: boolean) => void;
  className?: string;
}

export function MessageActions({
  content,
  messageId,
  isImportant = false,
  onToggleImportant,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const handleImportant = async () => {
    if (!messageId) return;
    const next = !isImportant;
    try {
      await apiFetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ isImportant: next }),
      });
      onToggleImportant?.(next);
      toast.success(next ? "Marked as important." : "Removed important flag.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update message.");
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleCopy}
        aria-label="Copy message"
        className="text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      {messageId && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleImportant}
          aria-label="Toggle important"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isImportant && "text-amber-500 hover:text-amber-500",
          )}
        >
          <Star className={cn("h-3.5 w-3.5", isImportant && "fill-current")} />
        </Button>
      )}
    </div>
  );
}
