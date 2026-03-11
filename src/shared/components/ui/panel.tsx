import { memo } from "react";
import { cn } from "@/shared/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Panel = memo(({ children, className, as: Tag = "div" }: PanelProps) => (
  <Tag
    className={cn(
      "rounded-2xl border border-border bg-card shadow-sm",
      className,
    )}
  >
    {children}
  </Tag>
));

Panel.displayName = "Panel";

interface PanelHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export const PanelHeader = memo(({ title, action }: PanelHeaderProps) => (
  <div className="flex items-center justify-between border-b border-border px-4 py-3">
    <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
    {action}
  </div>
));

PanelHeader.displayName = "PanelHeader";
