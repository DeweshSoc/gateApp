"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  children?: React.ReactNode;
}

/**
 * Fenced code block wrapper with a language label and copy button. The inner
 * `children` are the already-highlighted nodes produced by rehype-highlight.
 */
export function CodeBlock({ code, language, children }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context); fail silently.
    }
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
        <span className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
          {language || "text"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.7rem] text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
          )}
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto bg-[#0d1117] p-4 text-sm">
        <code className="font-mono text-[0.85rem] leading-6">{children ?? code}</code>
      </pre>
    </div>
  );
}
