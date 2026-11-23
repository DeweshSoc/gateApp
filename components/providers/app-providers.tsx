"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </ThemeProvider>
  );
}
