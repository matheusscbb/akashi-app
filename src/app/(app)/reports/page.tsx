import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { PanelSkeleton } from "@/shared/components/ui/skeleton";
import { ChartsPanel, SpendingTrendChart } from "@/features/reports";

export const metadata: Metadata = { title: "Relatórios" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize padrões de tempo e gastos ao longo do tempo
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense fallback={<PanelSkeleton className="h-96" />}>
          <ChartsPanel />
        </Suspense>
        <Suspense fallback={<PanelSkeleton className="h-96" />}>
          <SpendingTrendChart />
        </Suspense>
      </div>
    </div>
  );
}
