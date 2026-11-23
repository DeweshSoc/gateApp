"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare, MoreHorizontal, Pin, PinOff, Trash2, Pencil } from "lucide-react";
import { apiFetch, invalidateApiCache } from "@/lib/api-client";
import { formatRelativeDate } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import type { ConversationDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const activeId = params?.id;

  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const isLoading = useChatStore((s) => s.isLoadingConversations);
  const setLoading = useChatStore((s) => s.setLoadingConversations);

  const [renaming, setRenaming] = React.useState<ConversationDTO | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<ConversationDTO[]>("/api/conversations")
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load chats.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setConversations, setLoading]);

  const pinned = conversations.filter((c) => c.isPinned);
  const rest = conversations.filter((c) => !c.isPinned);

  async function handleDelete(conversation: ConversationDTO) {
    try {
      await apiFetch(`/api/conversations/${conversation.id}`, { method: "DELETE" });
      invalidateApiCache("/api/conversations");
      removeConversation(conversation.id);
      toast.success("Chat deleted.");
      if (activeId === conversation.id) router.push("/chat");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete chat.");
    }
  }

  async function handleTogglePin(conversation: ConversationDTO) {
    try {
      const updated = await apiFetch<ConversationDTO>(
        `/api/conversations/${conversation.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isPinned: !conversation.isPinned }),
        },
      );
      invalidateApiCache("/api/conversations");
      upsertConversation(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update chat.");
    }
  }

  async function submitRename() {
    if (!renaming) return;
    const title = renameValue.trim();
    if (!title) return;
    try {
      const updated = await apiFetch<ConversationDTO>(
        `/api/conversations/${renaming.id}`,
        { method: "PATCH", body: JSON.stringify({ title }) },
      );
      invalidateApiCache("/api/conversations");
      upsertConversation(updated);
      setRenaming(null);
      toast.success("Chat renamed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rename chat.");
    }
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-1.5 px-1 py-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
        No conversations yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pinned.length > 0 && (
        <Section label="Pinned">
          {pinned.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              active={activeId === c.id}
              onNavigate={onNavigate}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onRename={(conv) => {
                setRenaming(conv);
                setRenameValue(conv.title);
              }}
            />
          ))}
        </Section>
      )}

      <Section label="Recent">
        {rest.map((c) => (
          <ConversationRow
            key={c.id}
            conversation={c}
            active={activeId === c.id}
            onNavigate={onNavigate}
            onDelete={handleDelete}
            onTogglePin={handleTogglePin}
            onRename={(conv) => {
              setRenaming(conv);
              setRenameValue(conv.title);
            }}
          />
        ))}
      </Section>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>Give this conversation a clearer title.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submitRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitRename()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-2.5 pb-1 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

interface RowProps {
  conversation: ConversationDTO;
  active: boolean;
  onNavigate?: () => void;
  onDelete: (c: ConversationDTO) => void;
  onTogglePin: (c: ConversationDTO) => void;
  onRename: (c: ConversationDTO) => void;
}

function ConversationRow({
  conversation,
  active,
  onNavigate,
  onDelete,
  onTogglePin,
  onRename,
}: RowProps) {
  // Lazily mount the Radix dropdown only after the row is first hovered or
  // focused. Rendering a full menu (popper, focus trap) per row is expensive
  // when the sidebar holds up to 200 conversations.
  const [menuReady, setMenuReady] = React.useState(false);

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md pr-1 transition-colors",
        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
      )}
      onMouseEnter={() => setMenuReady(true)}
      onFocus={() => setMenuReady(true)}
    >
      <Link
        href={`/chat/${conversation.id}`}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2"
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{conversation.title}</span>
          <span className="block text-[0.7rem] text-muted-foreground">
            {conversation.lastMessageAt
              ? formatRelativeDate(conversation.lastMessageAt)
              : "New"}
          </span>
        </span>
      </Link>

      {menuReady ? (
        <DropdownMenu onOpenChange={(open) => open && setMenuReady(true)}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label="Chat options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRename(conversation)}>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTogglePin(conversation)}>
              {conversation.isPinned ? <PinOff /> : <Pin />}
              {conversation.isPinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(conversation)}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0"
          aria-hidden="true"
          tabIndex={-1}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
