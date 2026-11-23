"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";
import { ConversationList } from "./conversation-list";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useChatStore } from "@/store/chat";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  const handleNewChat = () => {
    setSidebarOpen(false);
    onNavigate?.();
    router.push("/chat");
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center justify-between px-3">
        <Logo />
        <ThemeToggle />
      </div>

      <div className="px-3 pb-2">
        <Button className="w-full justify-start" size="sm" onClick={handleNewChat}>
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="px-3 pb-2">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <Separator className="mx-3 w-auto" />

      <div className="px-3 pt-2 pb-1">
        <p className="px-1 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          Chats
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
        <ConversationList onNavigate={onNavigate} />
      </ScrollArea>

      <Separator className="mx-3 w-auto" />
      <div className="px-3 py-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="block rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          v0.1.0 · local
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r md:block">
      <SidebarContent />
    </aside>
  );
}
