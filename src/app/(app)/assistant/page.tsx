import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { PanelSkeleton } from "@/shared/components/ui/skeleton";
import { AssistantPanel } from "@/features/assistant";

export const metadata: Metadata = { title: "Assistente" };

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Assistente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Converse com seu assistente pessoal para planejar o dia, analisar finanças e muito mais
        </p>
      </div>

      <div className="h-[calc(100vh-200px)]">
        <Suspense fallback={<PanelSkeleton className="h-full" />}>
          <AssistantPanel />
        </Suspense>
      </div>
    </div>
  );
}
