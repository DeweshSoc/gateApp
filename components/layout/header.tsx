"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Header({ title }: { title?: string }) {
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 md:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="md:hidden">
        <Logo showText={false} />
      </div>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
        {title ?? "GATE 2027 AI"}
      </h1>

      <div className="md:hidden">
        <ThemeToggle />
      </div>
    </header>
  );
}
