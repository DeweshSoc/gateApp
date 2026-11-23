import { BarChart3, Flame, Target, TrendingUp } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Dashboard" };

const STATS = [
  { label: "Study streak", value: "0 days", icon: Flame },
  { label: "Topics completed", value: "0", icon: Target },
  { label: "Questions attempted", value: "0", icon: BarChart3 },
  { label: "Accuracy", value: "—", icon: TrendingUp },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Track your GATE preparation progress, streak, and activity."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <EmptyState
          icon={BarChart3}
          title="No activity yet"
          description="Your progress will appear here once you start studying and attempting questions."
        />
      </div>
    </PageShell>
  );
}
