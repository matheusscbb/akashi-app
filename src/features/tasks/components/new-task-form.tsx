"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCreateTask } from "../hooks/use-tasks";

export function NewTaskForm() {
  const [title, setTitle] = useState("");
  const createTask = useCreateTask();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask.mutate({ title: trimmed }, { onSuccess: () => setTitle("") });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nova tarefa..."
        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        disabled={createTask.isPending}
      />
      <button
        type="submit"
        disabled={!title.trim() || createTask.isPending}
        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
      </button>
    </form>
  );
}
