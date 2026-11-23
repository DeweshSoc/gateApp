import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link href="/chat" className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="h-4 w-4" />
      </span>
      {showText && <span className="truncate text-sm tracking-tight">{APP_NAME}</span>}
    </Link>
  );
}
