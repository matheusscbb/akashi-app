import type { TaskPriority, GoalType, TransactionType, ChartPeriod } from "@/shared/types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  tasks:        ["tasks"]        as const,
  transactions: ["transactions"] as const,
  goals:        ["goals"]        as const,
  categories:   ["categories"]   as const,
  conversations:["conversations"] as const,
} as const;

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const TASK_PRIORITY: Record<
  TaskPriority,
  { label: string; color: string; bg: string }
> = {
  low:    { label: "Baixa",   color: "#6b7280", bg: "bg-gray-100 text-gray-600" },
  medium: { label: "Média",   color: "#f59e0b", bg: "bg-amber-100 text-amber-700" },
  high:   { label: "Alta",    color: "#ef4444", bg: "bg-red-100 text-red-600" },
  urgent: { label: "Urgente", color: "#dc2626", bg: "bg-red-200 text-red-800" },
};

export const TASK_STATUS = {
  pending:     { label: "Pendente",     icon: "circle" },
  in_progress: { label: "Em progresso", icon: "loader-circle" },
  done:        { label: "Concluída",    icon: "check-circle-2" },
  cancelled:   { label: "Cancelada",    icon: "x-circle" },
} as const;

// ─── Finance ──────────────────────────────────────────────────────────────────
export const TRANSACTION_TYPE: Record<
  TransactionType,
  { label: string; color: string; sign: string }
> = {
  income:   { label: "Receita",       color: "#10b981", sign: "+" },
  expense:  { label: "Gasto",         color: "#ef4444", sign: "-" },
  transfer: { label: "Transferência", color: "#6366f1", sign: "~" },
};

export const GOAL_TYPE: Record<GoalType, { label: string; icon: string }> = {
  savings:        { label: "Poupança",        icon: "piggy-bank" },
  spending_limit: { label: "Limite de gasto", icon: "shield-alert" },
  income_target:  { label: "Meta de receita", icon: "trending-up" },
  task_habit:     { label: "Hábito",          icon: "repeat" },
  custom:         { label: "Personalizado",   icon: "star" },
};

// ─── Charts ───────────────────────────────────────────────────────────────────
export const CHART_PERIODS: Array<{ value: ChartPeriod; label: string }> = [
  { value: "day",    label: "Hoje" },
  { value: "week",   label: "Semana" },
  { value: "month",  label: "Mês" },
  { value: "custom", label: "Personalizado" },
];

export const CATEGORY_PALETTE = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16",
] as const;

// ─── App ──────────────────────────────────────────────────────────────────────
export const ASSISTANT_SESSION_KEY = "akashi_session_id";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard",  icon: "layout-dashboard" },
  { href: "/finance",   label: "Finanças",   icon: "dollar-sign" },
  { href: "/reports",   label: "Relatórios", icon: "bar-chart-3" },
  { href: "/assistant", label: "Assistente", icon: "bot" },
] as const;
