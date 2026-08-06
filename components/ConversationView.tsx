"use client";

import { parseConversation } from "@/lib/conversation-format";

/**
 * Renders a stored AI response. Plain-text values render as-is; JSON
 * conversation arrays render as alternating question / answer bubbles.
 */
export function ConversationView({
  raw,
  className = "",
  textClassName = "text-xs text-text-primary leading-relaxed",
}: {
  raw: string | null | undefined;
  className?: string;
  textClassName?: string;
}) {
  const convo = parseConversation(raw);

  if (!convo) {
    return (
      <p className={`${textClassName} whitespace-pre-wrap ${className}`}>
        {raw}
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {convo.map((msg, i) => {
        if (msg.role === "user") {
          // The first user message is the original question; later ones are follow-ups
          const isFollowUp = convo.slice(0, i).some((m) => m.role === "user");
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] px-3 py-2 rounded-xl bg-mystic-purple/20 border border-mystic-purple/25">
                <p className="text-[9px] text-mystic-rose/60 mb-0.5 font-cinzel tracking-wide">
                  {isFollowUp ? "追问" : "提问"}
                </p>
                <p className={`${textClassName} whitespace-pre-wrap`}>{msg.content}</p>
              </div>
            </div>
          );
        }
        return (
          <p key={i} className={`${textClassName} whitespace-pre-wrap`}>
            {msg.content}
          </p>
        );
      })}
    </div>
  );
}
