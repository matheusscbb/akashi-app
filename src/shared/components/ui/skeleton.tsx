import { cn } from "@/shared/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export function PanelSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm animate-pulse",
        className
      )}
    />
  );
}
