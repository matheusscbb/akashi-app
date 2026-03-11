"use client";

import { memo } from "react";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { TASK_PRIORITY } from "@/shared/constants";
import { useUpdateTaskStatus, useDeleteTask } from "../hooks/use-tasks";
import type { Task } from "@/shared/types";

interface TaskItemProps {
  task: Task;
}

export const TaskItem = memo(({ task }: TaskItemProps) => {
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const isDone = task.status === "done";

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
      <button
        onClick={() => updateStatus.mutate({ id: task.id, status: isDone ? "pending" : "done" })}
        className={cn("mt-0.5 shrink-0 transition-colors", isDone ? "text-emerald-500" : "text-muted-foreground hover:text-primary")}
        aria-label={isDone ? "Marcar como pendente" : "Concluir tarefa"}
      >
        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium", TASK_PRIORITY[task.priority].bg)}>
          {TASK_PRIORITY[task.priority].label}
        </span>
      </div>

      <button
        onClick={() => deleteTask.mutate(task.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Excluir tarefa"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});

TaskItem.displayName = "TaskItem";
