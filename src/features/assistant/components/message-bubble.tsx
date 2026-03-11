import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { ChatMessage } from "@/shared/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
