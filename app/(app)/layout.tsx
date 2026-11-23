import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <MobileDrawer />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
