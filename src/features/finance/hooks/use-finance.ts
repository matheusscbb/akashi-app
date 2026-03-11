import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/lib/supabase/client";
import { QUERY_KEYS } from "@/shared/constants";
import type { Transaction, UserGoal, CreateTransactionPayload, CreateGoalPayload, MonthlyTotals, DonutSlice } from "@/shared/types";

export function useTransactions() {
  const supabase = createClient();
  return useQuery<Transaction[]>({
    queryKey: QUERY_KEYS.transactions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, transaction_categories(*)")
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTransactionsByRange(from: Date, to: Date) {
  const { data: transactions = [] } = useTransactions();
  return transactions.filter((t) => {
    const d = new Date(t.occurred_at);
    return d >= from && d <= to;
  });
}

export function useMonthlyTotals(): MonthlyTotals {
  const { data: transactions = [] } = useTransactions();
  const now = new Date();
  const monthly = transactions.filter((t) => {
    const d = new Date(t.occurred_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const income = monthly.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthly.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expenses };
}

export function useFinancialDonutData(): DonutSlice[] {
  const { data: transactions = [] } = useTransactions();
  const now = new Date();
  const monthly = transactions.filter((t) => {
    const d = new Date(t.occurred_at);
    return t.type === "expense" && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const counts: Record<string, { value: number; color: string }> = {};
  monthly.forEach((t) => {
    const name = t.transaction_categories?.name ?? "Sem categoria";
    const color = t.transaction_categories?.color ?? "#6366f1";
    if (!counts[name]) counts[name] = { value: 0, color };
    counts[name].value += t.amount;
  });
  return Object.entries(counts).map(([name, { value, color }]) => ({ name, value, color }));
}

export function useCreateTransaction() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTransactionPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...payload, user_id: user.id, occurred_at: payload.occurred_at ?? new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data as Transaction;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions }),
  });
}

export function useGoals() {
  const supabase = createClient();
  return useQuery<UserGoal[]>({
    queryKey: QUERY_KEYS.goals,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateGoal() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateGoalPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("user_goals")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as UserGoal;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals }),
  });
}
