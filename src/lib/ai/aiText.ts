import "server-only";

export const getText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const text = (value as { text?: unknown }).text;
  if (typeof text === "string") return text;

  const content = (value as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const typed = part as { type?: unknown; text?: unknown };
        if (typed.type === "text" && typeof typed.text === "string") {
          return typed.text;
        }
        return typeof typed.text === "string" ? typed.text : "";
      })
      .join("");
  }

  return "";
};

export const findLastAssistantMessage = (
  messages: unknown[],
): unknown | null => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message || typeof message !== "object") continue;
    const role = (message as { role?: unknown }).role;
    const type = (message as { type?: unknown }).type;
    if (role === "assistant" || type === "ai") {
      return message;
    }
  }
  return messages.length ? messages[messages.length - 1] : null;
};

export const extractTextFromResult = (result: unknown): string => {
  if (!result) return "";
  if (typeof result === "string") return result;

  if (typeof result === "object") {
    const maybeMessages = (result as { messages?: unknown }).messages;
    if (Array.isArray(maybeMessages) && maybeMessages.length) {
      const last = findLastAssistantMessage(maybeMessages);
      if (last) return getText(last);
    }
  }

  return getText(result);
};
