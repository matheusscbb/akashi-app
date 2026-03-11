// ─── Enums ───────────────────────────────────────────────────────────────────
export type TaskStatus      = "pending" | "in_progress" | "done" | "cancelled";
export type TaskPriority    = "low" | "medium" | "high" | "urgent";
export type TransactionType = "income" | "expense" | "transfer";
export type TransactionSource = "manual" | "open_finance" | "import";
export type GoalType        = "savings" | "spending_limit" | "income_target" | "task_habit" | "custom";
export type GoalStatus      = "active" | "achieved" | "paused" | "cancelled";
export type MessageRole     = "user" | "assistant" | "system";
export type ChartPeriod     = "day" | "week" | "month" | "custom";

// ─── Database Entities ────────────────────────────────────────────────────────
export interface User {
  id: string;
  auth_id: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  due_at: string | null;
  done_at: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  task_categories?: TaskCategory | null;
}

export interface TransactionCategory {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  is_default: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  task_id: string | null;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  type: TransactionType;
  source: TransactionSource;
  external_id: string | null;
  account_name: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  transaction_categories?: TransactionCategory | null;
}

export interface UserGoal {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  type: GoalType;
  status: GoalStatus;
  target_amount: number | null;
  current_amount: number;
  target_date: string | null;
  achieved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── UI / View Models ─────────────────────────────────────────────────────────
export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DailySummaryData {
  tasks_pending: number;
  tasks_done: number;
  tasks_overdue: number;
  top_priority_task: Task | null;
}

export interface MonthlyTotals {
  income: number;
  expenses: number;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────
export interface CreateTaskPayload {
  title: string;
  category_id?: string;
  description?: string;
  priority?: TaskPriority;
  due_at?: string;
  estimated_minutes?: number;
}

export interface CreateTransactionPayload {
  title: string;
  amount: number;
  type: TransactionType;
  category_id?: string;
  task_id?: string;
  occurred_at?: string;
  description?: string;
}

export interface CreateGoalPayload {
  title: string;
  type: GoalType;
  target_amount?: number;
  target_date?: string;
  description?: string;
  category_id?: string;
}

export interface AssistantResponse {
  content: string;
  session_id: string;
  usage: { input_tokens: number; output_tokens: number };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
