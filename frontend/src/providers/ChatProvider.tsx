import React, { useCallback, useEffect, useRef, useState } from 'react';
import useChatCompletion from '@/hooks/useChatCompletion';
import type { ChatCompletionsRequest, Message } from '@/types.ts';
import { ChatContext, type ChatContextType } from '@/hooks/useChat';

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [history, setHistory] = useState<Message[]>([]);
  const [currentRequest, setCurrentRequest] =
    useState<ChatCompletionsRequest | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const responseAddedRef = useRef<boolean>(false);

  const { result, reasoning, reasoning_content, isLoading, error, finishReason, jobId } = useChatCompletion(
    currentRequest,
    !!currentRequest,
  );

  useEffect(() => {
    if (
      !isLoading &&
      result &&
      finishReason &&
      !responseAddedRef.current &&
      currentRequest
    ) {
      setHistory((prevHistory) => {
        const lastMessage = prevHistory[prevHistory.length - 1];
        if (
          lastMessage?.role === 'assistant' &&
          lastMessage.content === result
        ) {
          return prevHistory;
        }
        const historyWithoutPartial = prevHistory.filter(
          (msg) => !(msg.role === 'assistant' && msg.content === ''),
        );
        return [
          ...historyWithoutPartial,
          { 
            role: 'assistant', 
            content: result,
            reasoning: reasoning || null,
            reasoning_content: reasoning_content || null,
          },
        ];
      });
      setCurrentRequest(null);
      responseAddedRef.current = true;
    }

    if (isLoading && currentRequest && !responseAddedRef.current) {
      responseAddedRef.current = false;
    }
  }, [isLoading, result, reasoning, reasoning_content, finishReason, currentRequest, jobId]);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const sendMessage = useCallback(
    (message: string, location: string) => {
      if (!message.trim() || (isLoading && !!currentRequest)) return;

      if (!isChatOpen) {
        setIsChatOpen(true);
      }

      const userMessage: Message = { role: 'user', content: message };
      const updatedHistory = [...history, userMessage];
      setHistory(updatedHistory);

      const newRequest: ChatCompletionsRequest = {
        input: message,
        history: updatedHistory,
        location,
      };

      setCurrentRequest(newRequest);
      responseAddedRef.current = false;
    },
    [history, isLoading, currentRequest, isChatOpen],
  );

  const contextValue: ChatContextType = {
    isChatOpen,
    history,
    isLoading: isLoading && !!currentRequest,
    error,
    streamingResult: isLoading && !!currentRequest && result ? result : '',
    openChat,
    closeChat,
    sendMessage,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
