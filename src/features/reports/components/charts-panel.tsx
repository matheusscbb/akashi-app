"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/shared/components/ui/panel";
import { CHART_PERIODS } from "@/shared/constants";
import { useTaskDonutData } from "@/features/tasks";
import { useFinancialDonutData } from "@/features/finance";
import { DonutChart } from "./donut-chart";
import type { ChartPeriod } from "@/shared/types";

export function ChartsPanel() {
  const [period, setPeriod] = useState<ChartPeriod>("month");
  const taskData = useTaskDonutData();
  const financeData = useFinancialDonutData();

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Distribuição"
        action={
          <div className="flex gap-1">
            {CHART_PERIODS.filter((p) => p.value !== "custom").map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
        <DonutChart data={taskData} title="Tempo por categoria" />
        <DonutChart data={financeData} title="Gastos por categoria" />
      </div>
    </Panel>
  );
}
