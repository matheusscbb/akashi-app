import { cn } from "@/shared/lib/utils";

type Variant = "default" | "success" | "danger" | "income" | "expense";

const variantStyles: Record<Variant, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-red-600 dark:text-red-400",
  income: "text-emerald-600 dark:text-emerald-400",
  expense: "text-red-600 dark:text-red-400",
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: Variant;
}

export function StatCard({ icon, label, value, variant = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={cn("mt-2 text-xl font-bold tabular-nums", variantStyles[variant])}>
        {value}
      </p>
    </div>
  );
}
