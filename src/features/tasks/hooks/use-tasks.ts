import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/lib/supabase/client";
import { QUERY_KEYS } from "@/shared/constants";
import type { Task, CreateTaskPayload, TaskStatus, DonutSlice } from "@/shared/types";

export function useTasks() {
  const supabase = createClient();
  return useQuery<Task[]>({
    queryKey: QUERY_KEYS.tasks,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, task_categories(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFilteredTasks(search: string) {
  const { data: tasks = [] } = useTasks();
  if (!search) return tasks;
  const q = search.toLowerCase();
  return tasks.filter((t) => t.title.toLowerCase().includes(q));
}

export function useDailySummary() {
  const { data: tasks = [] } = useTasks();
  const now = new Date();

  const pending = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const done = tasks.filter(
    (t) => t.status === "done" && t.done_at && new Date(t.done_at).toDateString() === now.toDateString()
  ).length;
  const overdue = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled" && t.due_at && new Date(t.due_at) < now
  ).length;
  const top_priority_task =
    tasks
      .filter((t) => t.status !== "done" && t.status !== "cancelled")
      .sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      })[0] ?? null;

  return { pending, done, overdue, top_priority_task };
}

export function useTaskDonutData(): DonutSlice[] {
  const { data: tasks = [] } = useTasks();
  const counts: Record<string, number> = {};
  tasks.forEach((t) => {
    const name = t.task_categories?.name ?? "Sem categoria";
    counts[name] = (counts[name] ?? 0) + (t.actual_minutes ?? t.estimated_minutes ?? 0);
  });
  const colors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  return Object.entries(counts).map(([name, value], i) => ({
    name,
    value,
    color: colors[i % colors.length],
  }));
}

export function useCreateTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("tasks").insert({ ...payload, user_id: user.id }).select().single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks }),
  });
}

export function useUpdateTaskStatus() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const done_at = status === "done" ? new Date().toISOString() : null;
      const { error } = await supabase.from("tasks").update({ status, done_at }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks });
      const prev = queryClient.getQueryData<Task[]>(QUERY_KEYS.tasks);
      queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, status } : t))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEYS.tasks, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks }),
  });
}

export function useDeleteTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks }),
  });
}
