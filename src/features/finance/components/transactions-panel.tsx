"use client";

import { Panel, PanelHeader } from "@/shared/components/ui/panel";
import { useTransactions } from "../hooks/use-finance";
import { TransactionRow } from "./transaction-row";

export function TransactionsPanel() {
  const { data: transactions = [] } = useTransactions();

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Transações" />
      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma transação registrada</p>
        ) : (
          transactions.map((t) => <TransactionRow key={t.id} transaction={t} />)
        )}
      </div>
    </Panel>
  );
}
