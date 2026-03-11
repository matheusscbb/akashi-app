import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { PanelSkeleton } from "@/shared/components/ui/skeleton";
import { FinanceSummary, GoalsPanel, TransactionsPanel } from "@/features/finance";

export const metadata: Metadata = { title: "Finanças" };

export default function FinancePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Finanças</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle seus gastos, receitas e metas financeiras
        </p>
      </div>

      <div className="mb-6">
        <Suspense fallback={<PanelSkeleton className="h-28" />}>
          <FinanceSummary />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 min-h-[500px]">
          <Suspense fallback={<PanelSkeleton className="h-full" />}>
            <TransactionsPanel />
          </Suspense>
        </div>
        <div className="lg:col-span-5">
          <Suspense fallback={<PanelSkeleton className="h-[500px]" />}>
            <GoalsPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
