export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Stored AI responses come in two shapes:
 *  - plain text  — a single interpretation with no follow-ups (legacy + current first-round)
 *  - JSON array  — [{role, content}, ...] when the user asked follow-up questions
 *
 * Returns null when the value is plain text, so callers can keep their existing rendering.
 */
export function parseConversation(raw: string | null | undefined): ConversationMessage[] | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const valid = parsed.filter(
      (m): m is ConversationMessage =>
        m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant")
    );
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

/** Flatten a stored AI response to readable plain text (for exports, previews, clipboard). */
export function conversationToPlainText(raw: string | null | undefined): string {
  const convo = parseConversation(raw);
  if (!convo) return raw || "";
  return convo
    .map((m) => (m.role === "user" ? `【提问】${m.content}` : m.content))
    .join("\n\n");
}

/** Short one-line preview of a stored AI response. */
export function conversationPreview(raw: string | null | undefined, maxLen = 120): string {
  const convo = parseConversation(raw);
  const source = convo
    ? convo.find((m) => m.role === "assistant")?.content || convo[0].content
    : raw || "";
  const flat = source.replace(/\s+/g, " ").trim();
  return flat.length > maxLen ? flat.slice(0, maxLen) + "…" : flat;
}

/** Number of follow-up rounds the user asked (0 when there are none). */
export function followUpCount(raw: string | null | undefined): number {
  const convo = parseConversation(raw);
  if (!convo) return 0;
  return Math.max(0, convo.filter((m) => m.role === "user").length - 1);
}
