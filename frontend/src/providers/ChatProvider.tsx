import React, { useCallback, useEffect, useRef, useState } from 'react';
import useChatCompletion from '@/hooks/useChatCompletion';
import type { ChatCompletionsRequest, Message } from '@/types.ts';
import { ChatContext, type ChatContextType } from '@/hooks/useChat';

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRequest, setCurrentRequest] =
    useState<ChatCompletionsRequest | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const responseAddedRef = useRef<boolean>(false);

  const {
    result,
    reasoning,
    reasoning_content,
    isLoading,
    error,
    finishReason,
    jobId,
  } = useChatCompletion(currentRequest, !!currentRequest);

  useEffect(() => {
    if (
      !isLoading &&
      result &&
      finishReason &&
      !responseAddedRef.current &&
      currentRequest
    ) {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (
          lastMessage?.role === 'assistant' &&
          lastMessage.content === result
        ) {
          return prevMessages;
        }
        const messagesWithoutPartial = prevMessages.filter(
          (msg) => !(msg.role === 'assistant' && msg.content === ''),
        );
        return [
          ...messagesWithoutPartial,
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
  }, [
    isLoading,
    result,
    reasoning,
    reasoning_content,
    finishReason,
    currentRequest,
    jobId,
  ]);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const sendMessage = useCallback(
    (message: string, location: string) => {
      if (!message.trim() || (isLoading && !!currentRequest)) return;

      if (!isChatOpen) {
        setIsChatOpen(true);
      }

      const userMessage: Message = { role: 'user', content: message };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      const newRequest: ChatCompletionsRequest = {
        messages: updatedMessages,
        location,
      };

      setCurrentRequest(newRequest);
      responseAddedRef.current = false;
    },
    [messages, isLoading, currentRequest, isChatOpen],
  );

  const contextValue: ChatContextType = {
    isChatOpen,
    messages,
    isLoading: isLoading && !!currentRequest,
    error,
    streamingResult: isLoading && !!currentRequest && result ? result : '',
    streamingReasoning:
      isLoading && !!currentRequest && reasoning ? reasoning : '',
    streamingReasoningContent:
      isLoading && !!currentRequest && reasoning_content
        ? reasoning_content
        : '',
    openChat,
    toggleChat,
    closeChat,
    sendMessage,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
