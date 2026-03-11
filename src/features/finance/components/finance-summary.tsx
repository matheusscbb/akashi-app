"use client";

import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { StatCard } from "@/shared/components/ui/stat-card";
import { formatCurrency } from "@/shared/lib/utils";
import { useMonthlyTotals } from "../hooks/use-finance";

export function FinanceSummary() {
  const { income, expenses } = useMonthlyTotals();
  const balance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="Receitas do mês"
        value={formatCurrency(income)}
        variant="income"
      />
      <StatCard
        icon={<TrendingDown className="h-5 w-5" />}
        label="Gastos do mês"
        value={formatCurrency(expenses)}
        variant="expense"
      />
      <StatCard
        icon={<Wallet className="h-5 w-5" />}
        label="Saldo"
        value={formatCurrency(balance)}
        variant={balance >= 0 ? "income" : "expense"}
      />
      <StatCard
        icon={<PiggyBank className="h-5 w-5" />}
        label="Taxa de poupança"
        value={`${savingsRate.toFixed(1)}%`}
        variant={savingsRate >= 20 ? "success" : "default"}
      />
    </div>
  );
}
