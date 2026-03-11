"use client";

import { Panel, PanelHeader } from "@/shared/components/ui/panel";
import { useGoals } from "../hooks/use-finance";
import { formatCurrency } from "@/shared/lib/utils";

export function GoalsPanel() {
  const { data: goals = [] } = useGoals();

  return (
    <Panel className="flex flex-col">
      <PanelHeader title="Metas" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {goals.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Nenhuma meta ativa</p>
        ) : (
          goals.map((goal) => {
            const progress = goal.target_amount
              ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
              : 0;
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-card-foreground truncate">{goal.title}</p>
                  {goal.target_amount && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                    </span>
                  )}
                </div>
                {goal.target_amount && (
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
