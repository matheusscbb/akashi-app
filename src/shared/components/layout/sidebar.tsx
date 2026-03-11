"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, DollarSign, BarChart3, Bot } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { NAV_ITEMS } from "@/shared/constants";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "dollar-sign": DollarSign,
  "bar-chart-3": BarChart3,
  "bot": Bot,
} as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-lg font-bold tracking-tight text-foreground">Akashi ✦</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
