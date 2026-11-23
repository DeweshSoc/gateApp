"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Render assistant/user Markdown with GFM tables, LaTeX (KaTeX), and
 * syntax-highlighted code. Streaming-safe: partial Markdown renders fine.
 *
 * Note: `detect` is explicitly disabled — highlighting only runs when a fenced
 * block declares an explicit `language-*` hint, skipping highlight.js
 * auto-detection on every block (a significant per-token streaming cost).
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const components = React.useMemo<Components>(
    () => ({
      // Route fenced code blocks through CodeBlock for the header + copy button.
      pre({ children }) {
        const child = React.Children.toArray(children)[0];
        if (React.isValidElement(child)) {
          const props = child.props as {
            className?: string;
            children?: React.ReactNode;
          };
          const match = /language-(\w+)/.exec(props.className ?? "");
          const raw = extractText(props.children);
          return (
            <CodeBlock language={match?.[1]} code={raw}>
              {props.children}
            </CodeBlock>
          );
        }
        return <pre>{children}</pre>;
      },
      a({ href, children }) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      },
    }),
    [],
  );

  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: false }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** Recursively collect text from React nodes (for the copy button). */
function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}
