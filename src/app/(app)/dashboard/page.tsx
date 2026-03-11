import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { PanelSkeleton } from "@/shared/components/ui/skeleton";
import { StatCard } from "@/shared/components/ui/stat-card";
import { getGreeting } from "@/shared/lib/utils";
import { TasksPanel } from "@/features/tasks";
import { GoalsPanel } from "@/features/finance";
import { AssistantPanel } from "@/features/assistant";
import { ChartsPanel } from "@/features/reports";
import { DailySummaryCards } from "./_components/daily-summary-cards";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {getGreeting()} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Summary stats */}
      <div className="mb-6">
        <Suspense fallback={<PanelSkeleton className="h-28" />}>
          <DailySummaryCards />
        </Suspense>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 h-[560px]">
          <Suspense fallback={<PanelSkeleton className="h-full" />}>
            <TasksPanel />
          </Suspense>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <Suspense fallback={<PanelSkeleton className="h-80" />}>
            <ChartsPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton className="h-64" />}>
            <GoalsPanel />
          </Suspense>
        </div>

        <div className="lg:col-span-4 h-[560px]">
          <Suspense fallback={<PanelSkeleton className="h-full" />}>
            <AssistantPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
