"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useChatStore } from "@/store/chat";
import { SidebarContent } from "./sidebar";

export function MobileDrawer() {
  const isOpen = useChatStore((s) => s.isSidebarOpen);
  const setOpen = useChatStore((s) => s.setSidebarOpen);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        showClose={false}
        className="left-0 top-0 h-full max-w-[18rem] translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-0 sm:rounded-none"
      >
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
