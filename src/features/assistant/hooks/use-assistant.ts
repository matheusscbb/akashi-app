"use client";

import { useState, useCallback } from "react";
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
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          session_id: getOrCreateSessionId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao obter resposta do assistente");
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Erro desconhecido";
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Desculpe, ocorreu um erro: ${errorText}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, sendMessage };
}
