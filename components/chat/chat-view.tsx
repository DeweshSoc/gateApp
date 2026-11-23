"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type {
  AiProfileDTO,
  ChatContextValue,
  ConversationDTO,
  MessageDTO,
  SubjectWithTopics,
} from "@/types";
import { apiFetch } from "@/lib/api-client";
import { Header } from "@/components/layout/header";
import { MessageList } from "./message-list";
import { Composer } from "./composer";
import { WelcomeScreen } from "./welcome-screen";
import { ChatContextBar } from "./chat-context-bar";
import { useChatStore } from "@/store/chat";

interface ChatViewProps {
  conversation: ConversationDTO | null;
  initialMessages: MessageDTO[];
  subjects?: SubjectWithTopics[];
  profiles?: AiProfileDTO[];
}

export function ChatView({
  conversation,
  initialMessages,
  subjects = [],
  profiles = [],
}: ChatViewProps) {
  const router = useRouter();
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  const [context, setContext] = React.useState<ChatContextValue>({
    subjectId: conversation?.subjectId ?? null,
    topicId: conversation?.topicId ?? null,
    profileId: null,
  });

  const [messages, setMessages] = React.useState<MessageDTO[]>(initialMessages);
  const [streamingContent, setStreamingContent] = React.useState<string | undefined>(
    undefined,
  );
  const [isStreaming, setIsStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const isStreamingRef = React.useRef(false);
  const conversationIdRef = React.useRef<string | null>(conversation?.id ?? null);

  React.useEffect(() => {
    setMessages(initialMessages);
    conversationIdRef.current = conversation?.id ?? null;
    setStreamingContent(undefined);
    setIsStreaming(false);
    setContext((prev) => ({
      ...prev,
      subjectId: conversation?.subjectId ?? prev.subjectId,
      topicId: conversation?.topicId ?? prev.topicId,
    }));
  }, [conversation?.id, conversation?.subjectId, conversation?.topicId, initialMessages]);

  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleToggleImportant = (id: string, next: boolean) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isImportant: next } : m)),
    );
  };

  const handleStop = () => abortRef.current?.abort();

  const sendMessage = React.useCallback(
    async (content: string) => {
      if (isStreamingRef.current) return;
      isStreamingRef.current = true;
      setIsStreaming(true);
      setStreamingContent("");
      let partial = "";

      const optimisticUser: MessageDTO = {
        id: `temp-user-${Date.now()}`,
        conversationId: conversationIdRef.current ?? "",
        role: "user",
        content,
        isImportant: false,
        tokenCount: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationIdRef.current ?? undefined,
            message: content,
            subjectId: context.subjectId ?? undefined,
            topicId: context.topicId ?? undefined,
            profileId: context.profileId ?? undefined,
          }),
          signal: controller.signal,
        });

        const newConversationId = response.headers.get("x-conversation-id");

        if (!response.ok || !response.body) {
          let message = `Request failed (${response.status}).`;
          try {
            const err = (await response.json()) as { error?: { message?: string } };
            if (err.error?.message) message = err.error.message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as {
                delta?: string;
                error?: string;
                messageId?: string;
              };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.delta) {
                partial += parsed.delta;
                setStreamingContent(partial);
              }
            } catch (error) {
              if (error instanceof SyntaxError) continue;
              throw error;
            }
          }
        }

        // Append the completed assistant message once.
        if (partial) {
          const assistantMessage: MessageDTO = {
            id: `assistant-${Date.now()}`,
            conversationId: newConversationId ?? conversationIdRef.current ?? "",
            role: "assistant",
            content: partial,
            isImportant: false,
            tokenCount: null,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
        setStreamingContent(undefined);

        // First message in a new chat: navigate to the persisted conversation.
        if (!conversationIdRef.current && newConversationId) {
          conversationIdRef.current = newConversationId;
          const created = await apiFetch<ConversationDTO>(
            `/api/conversations/${newConversationId}`,
          ).catch(() => null);
          if (created) upsertConversation(created);
          router.push(`/chat/${newConversationId}`);
          router.refresh();
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          toast.info("Generation stopped.");
        } else {
          toast.error(error instanceof Error ? error.message : "Failed to send message.");
        }
        // Preserve any partial output as a final assistant message.
        if (partial) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              conversationId: conversationIdRef.current ?? "",
              role: "assistant",
              content: partial,
              isImportant: false,
              tokenCount: null,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setStreamingContent(undefined);
      } finally {
        isStreamingRef.current = false;
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [router, upsertConversation, context.subjectId, context.topicId, context.profileId],
  );

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <>
      <Header title={conversation?.title} />

      {hasMessages ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MessageList
              messages={messages}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              onToggleImportant={handleToggleImportant}
            />
          </div>
          <ChatContextBar
            subjects={subjects}
            profiles={profiles}
            value={context}
            onChange={setContext}
            disabled={isStreaming}
          />
          <Composer
            onSubmit={sendMessage}
            onStop={handleStop}
            isStreaming={isStreaming}
          />
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <WelcomeScreen onSubmit={sendMessage} disabled={isStreaming} />
          <ChatContextBar
            subjects={subjects}
            profiles={profiles}
            value={context}
            onChange={setContext}
            disabled={isStreaming}
          />
        </div>
      )}

      {isStreaming && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm ring-1 ring-border">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating
          </span>
        </div>
      )}
    </>
  );
}
