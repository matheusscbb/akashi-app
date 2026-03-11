"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/panel";
import { useFilteredTasks } from "../hooks/use-tasks";
import { TaskItem } from "./task-item";
import { NewTaskForm } from "./new-task-form";

export function TasksPanel() {
  const [search, setSearch] = useState("");
  const tasks = useFilteredTasks(search);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Tarefas" />

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </div>

      <NewTaskForm />
    </Panel>
  );
}
