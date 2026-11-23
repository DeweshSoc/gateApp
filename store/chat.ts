"use client";

import { create } from "zustand";
import type { ConversationDTO } from "@/types";

interface ChatState {
  conversations: ConversationDTO[];
  isSidebarOpen: boolean;
  isLoadingConversations: boolean;

  setConversations: (conversations: ConversationDTO[]) => void;
  upsertConversation: (conversation: ConversationDTO) => void;
  removeConversation: (id: string) => void;
  setLoadingConversations: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  isSidebarOpen: false,
  isLoadingConversations: false,

  setConversations: (conversations) =>
    // Drop any malformed rows (missing `id`); such a row would render a link
    // to `/chat/undefined`. Protects against provider/API shape regressions.
    set({ conversations: conversations.filter((c) => Boolean(c?.id)) }),

  upsertConversation: (conversation) =>
    set((state) => {
      // Guard against malformed entries (e.g. a response shape mismatch that
      // yields `id: undefined`). Such a row would link to `/chat/undefined`.
      if (!conversation?.id) return {};
      const existing = state.conversations.findIndex((c) => c.id === conversation.id);
      if (existing === -1) {
        return { conversations: [conversation, ...state.conversations] };
      }
      const next = [...state.conversations];
      next[existing] = conversation;
      return { conversations: next };
    }),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
    })),

  setLoadingConversations: (isLoadingConversations) => set({ isLoadingConversations }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
