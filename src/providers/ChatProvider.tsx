"use client";
import React, { useCallback, useMemo, useState } from "react";
import useChatAgent from "@/hooks/useChatAgent";
import type { AgentMessage, AgentRequest } from "@/types/agent";
import { ChatContext, type ChatContextType } from "@/hooks/useChat";
import { trackUiEvent } from "@/api/analytics";

interface ChatProviderProps {
  children: React.ReactNode;
}

const updateLastAssistantContent = (
  messages: AgentMessage[],
  content: string,
): AgentMessage[] => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role !== "assistant") continue;
    if (messages[i]?.content === content) return messages;
    const next = [...messages];
    next[i] = { ...next[i], content };
    return next;
  }
  return messages;
};

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [currentRequest, setCurrentRequest] = useState<AgentRequest | null>(
    null,
  );
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const { result, response, isLoading, error } = useChatAgent(
    currentRequest,
    !!currentRequest,
  );

  const overlayContent = useMemo(() => {
    if (!currentRequest) return null;
    if (response?.message?.content) return response.message.content;
    if (isLoading && result) return result;
    return null;
  }, [currentRequest, response, isLoading, result]);

  const displayMessages = useMemo(() => {
    if (!overlayContent) return messages;
    return updateLastAssistantContent(messages, overlayContent);
  }, [messages, overlayContent]);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    void trackUiEvent({ name: "chat_open" });
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    void trackUiEvent({ name: "chat_close" });
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev;
      void trackUiEvent({ name: next ? "chat_open" : "chat_close" });
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    (message: string, location: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || (isLoading && !!currentRequest)) return;

      if (!isChatOpen) {
        setIsChatOpen(true);
      }

      const userMessage: AgentMessage = {
        role: "user",
        content: trimmedMessage,
      };
      const baseMessages = overlayContent
        ? updateLastAssistantContent(messages, overlayContent)
        : messages;
      const requestMessages = [...baseMessages, userMessage];
      const placeholder: AgentMessage = { role: "assistant", content: "" };
      setMessages([...requestMessages, placeholder]);
      const newRequest: AgentRequest = {
        messages: requestMessages,
        location,
        stream: true,
      };

      void trackUiEvent({
        name: "chat_submit",
        properties: {
          location,
          promptLength: trimmedMessage.length,
        },
      });

      setCurrentRequest(newRequest);
    },
    [messages, isLoading, currentRequest, isChatOpen, overlayContent],
  );

  const contextValue: ChatContextType = {
    isChatOpen,
    messages: displayMessages,
    isLoading: isLoading && !!currentRequest,
    error,
    openChat,
    toggleChat,
    closeChat,
    sendMessage,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
