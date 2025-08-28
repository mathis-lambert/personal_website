import { createContext, useContext } from 'react';
import type { Message } from '@/types.ts';

export interface ChatContextType {
  isChatOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  streamingResult: string;
  streamingReasoning: string;
  streamingReasoningContent: string;
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
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default useChat;
