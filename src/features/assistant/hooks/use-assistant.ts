"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { ASSISTANT_SESSION_KEY } from "@/shared/constants";
import type { ChatMessage } from "@/shared/types";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  let id = sessionStorage.getItem(ASSISTANT_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(ASSISTANT_SESSION_KEY, id);
  }
  return id;
}

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { role: "user", content, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message: content, session_id: getOrCreateSessionId() }),
        }
      );

      if (!response.ok) throw new Error("Falha ao obter resposta do assistente");

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, sendMessage };
}
