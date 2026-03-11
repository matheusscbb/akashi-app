"use client";

import { createClient } from "@/shared/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function Header() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-end border-b border-border bg-card px-4">
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </header>
  );
}
