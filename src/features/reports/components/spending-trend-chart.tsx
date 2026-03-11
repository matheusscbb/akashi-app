"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Panel, PanelHeader } from "@/shared/components/ui/panel";
import { useTransactionsByRange } from "@/features/finance";
import { formatCurrency } from "@/shared/lib/utils";

export function SpendingTrendChart() {
  const to = useMemo(() => new Date(), []);
  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  }, []);

  const transactions = useTransactionsByRange(from, to);

  const data = useMemo(() => {
    const map: Record<string, { date: string; income: number; expense: number }> = {};
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map[key] = { date: key, income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const key = new Date(t.occurred_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!map[key]) return;
      if (t.type === "income") map[key].income += t.amount;
      if (t.type === "expense") map[key].expense += t.amount;
    });
    return Object.values(map);
  }, [transactions, from, to]);

  return (
    <Panel className="flex flex-col">
      <PanelHeader title="Últimos 30 dias" />
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={6} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} width={80} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
            <Line type="monotone" dataKey="income" name="Receita" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expense" name="Gasto" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
