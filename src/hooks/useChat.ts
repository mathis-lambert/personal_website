"use client";
import { createContext, useContext } from "react";
import type { AgentMessage } from "@/types/agent";

export interface ChatContextType {
  isChatOpen: boolean;
  messages: AgentMessage[];
  isLoading: boolean;
  error: Error | null;
  openChat: () => void;
  toggleChat: () => void;
  closeChat: () => void;
  sendMessage: (message: string, location: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined,
);

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export default useChat;
