"use client";

import { memo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { DonutSlice } from "@/shared/types";

interface DonutChartProps {
  data: DonutSlice[];
  title?: string;
}

export const DonutChart = memo(({ data, title }: DonutChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && <p className="text-sm font-medium text-muted-foreground px-1">{title}</p>}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString("pt-BR")} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

DonutChart.displayName = "DonutChart";
