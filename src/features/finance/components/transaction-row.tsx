import { memo } from "react";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/shared/lib/utils";
import type { Transaction } from "@/shared/types";

const typeIcon = {
  income: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  expense: <TrendingDown className="h-4 w-4 text-red-500" />,
  transfer: <ArrowLeftRight className="h-4 w-4 text-indigo-500" />,
};

const typeColor = {
  income: "text-emerald-600",
  expense: "text-red-600",
  transfer: "text-indigo-600",
};

const typeSign = { income: "+", expense: "-", transfer: "~" };

interface TransactionRowProps {
  transaction: Transaction;
}

export const TransactionRow = memo(({ transaction: t }: TransactionRowProps) => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
    <span className="shrink-0">{typeIcon[t.type]}</span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium truncate text-card-foreground">{t.title}</p>
      <p className="text-xs text-muted-foreground">{formatDate(t.occurred_at, { day: "numeric", month: "short" })}</p>
    </div>
    <span className={cn("text-sm font-semibold tabular-nums", typeColor[t.type])}>
      {typeSign[t.type]}{formatCurrency(t.amount)}
    </span>
  </div>
));

TransactionRow.displayName = "TransactionRow";
