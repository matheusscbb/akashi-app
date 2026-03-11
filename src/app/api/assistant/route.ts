import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/shared/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY não configurada. Adicione a variável de ambiente." },
        { status: 500 }
      );
    }

    const { message, session_id } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    // Fetch context in parallel — RLS filters automatically for the current user
    const [tasksRes, transactionsRes, goalsRes, historyRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("title, status, priority, due_at")
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(15),

      supabase
        .from("transactions")
        .select("title, amount, type, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(10),

      supabase
        .from("user_goals")
        .select("title, type, status, target_amount, current_amount")
        .eq("status", "active")
        .limit(5),

      session_id
        ? supabase
            .from("ai_conversations")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", { ascending: true })
            .limit(20)
        : Promise.resolve({ data: [] }),
    ]);

    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const systemPrompt = `Você é Akashi, um assistente pessoal inteligente focado em produtividade e controle financeiro.
Você tem acesso ao contexto real do usuário e responde de forma objetiva, prática e amigável em português.

Data/hora atual: ${now}

=== CONTEXTO DO USUÁRIO ===

Tarefas pendentes/em progresso (${tasksRes.data?.length ?? 0}):
${tasksRes.data?.map((t) => `- [${t.priority}] ${t.title}${t.due_at ? ` (vence: ${new Date(t.due_at).toLocaleDateString("pt-BR")})` : ""}`).join("\n") || "Nenhuma tarefa pendente."}

Transações recentes (${transactionsRes.data?.length ?? 0}):
${transactionsRes.data?.map((t) => `- ${t.type === "income" ? "+" : "-"} R$ ${Number(t.amount).toFixed(2)} | ${t.title} (${new Date(t.occurred_at).toLocaleDateString("pt-BR")})`).join("\n") || "Nenhuma transação registrada."}

Metas ativas (${goalsRes.data?.length ?? 0}):
${goalsRes.data?.map((g) => `- ${g.title}: ${g.current_amount}/${g.target_amount ?? "?"} (${g.type})`).join("\n") || "Nenhuma meta ativa."}

=== INSTRUÇÕES ===
- Responda sempre em português do Brasil
- Seja conciso e direto, mas amigável
- Use os dados reais do contexto ao analisar produtividade e finanças
- Não invente dados que não estão no contexto
- Sugira ações práticas quando pertinente`;

    // Build conversation history for Claude
    type MessageRole = "user" | "assistant";
    const history: { role: MessageRole; content: string }[] =
      (historyRes.data ?? [])
        .filter((m): m is { role: string; content: string } => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as MessageRole, content: m.content }));

    const messages: { role: MessageRole; content: string }[] = [
      ...history,
      { role: "user", content: message },
    ];

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const assistantContent =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    // Persist conversation (best-effort — don't fail the response if save fails)
    if (session_id) {
      const { data: profile } = await supabase.from("users").select("id").single();
      if (profile?.id) {
        await supabase.from("ai_conversations").insert([
          { user_id: profile.id, session_id, role: "user", content: message, tokens_used: null },
          {
            user_id: profile.id,
            session_id,
            role: "assistant",
            content: assistantContent,
            tokens_used: response.usage.input_tokens + response.usage.output_tokens,
          },
        ]);
      }
    }

    return NextResponse.json({
      content: assistantContent,
      session_id,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (err) {
    console.error("[api/assistant]", err);
    const message = err instanceof Error ? err.message : "Erro interno do servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
