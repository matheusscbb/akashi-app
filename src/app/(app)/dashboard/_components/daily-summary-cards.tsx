"use client";

import { memo } from "react";
import { AlertCircle, CheckCircle2, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { Flame } from "lucide-react";
import { StatCard } from "@/shared/components/ui/stat-card";
import { formatCurrency } from "@/shared/lib/utils";
import { TASK_PRIORITY } from "@/shared/constants";
import { useDailySummary } from "@/features/tasks";
import { useMonthlyTotals } from "@/features/finance";

export const DailySummaryCards = memo(() => {
  const { pending, done, overdue, top_priority_task } = useDailySummary();
  const { income, expenses } = useMonthlyTotals();
  const balance = income - expenses;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Clock className="h-5 w-5" />} label="Pendentes" value={pending} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Concluídas hoje" value={done} variant="success" />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Atrasadas"
          value={overdue}
          variant={overdue > 0 ? "danger" : "default"}
        />
        <StatCard
          icon={balance >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          label="Saldo do mês"
          value={formatCurrency(balance)}
          variant={balance >= 0 ? "income" : "expense"}
        />
      </div>

      {top_priority_task && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Flame className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Prioridade máxima</p>
            <p className="mt-0.5 font-semibold text-card-foreground truncate">{top_priority_task.title}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TASK_PRIORITY[top_priority_task.priority].bg}`}>
              {TASK_PRIORITY[top_priority_task.priority].label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
DailySummaryCards.displayName = "DailySummaryCards";
