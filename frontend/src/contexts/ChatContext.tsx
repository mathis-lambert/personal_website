import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import useChatCompletion, {
  Message,
  ChatCompletionsRequest,
} from '@/hooks/useChatCompletion';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownView from '@/components/ui/MarkdownView';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatContextType {
  isChatOpen: boolean;
  history: Message[];
  isLoading: boolean;
  error: Error | null;
  streamingResult: string;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (message: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  defaultPrompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  defaultPrompt = 'You are a helpful assistant integrated into a web app.',
  model = 'mistral-small-latest',
  temperature = 0.3,
  max_tokens = 1024,
  top_p = 0.95,
}) => {
  const [history, setHistory] = useState<Message[]>([]);
  const [currentRequest, setCurrentRequest] =
    useState<ChatCompletionsRequest | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const responseAddedRef = useRef<boolean>(false);
  const scrollToBottomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use direct DOM reference to the viewport div for more reliable scrolling
  const viewportRef = useRef<HTMLDivElement>(null);

  const { result, isLoading, error, finishReason, jobId } = useChatCompletion(
    currentRequest,
    !!currentRequest,
  );

  // Scroll helper function
  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, []);

  // Scroll on history changes (new messages)
  useLayoutEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  // Handle body overflow
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isChatOpen]);

  // Handle streaming result scrolling
  useEffect(() => {
    // Scroll when streaming content updates
    if (isLoading && result) {
      // Clear any existing timeout to prevent multiple calls
      if (scrollToBottomTimeoutRef.current) {
        clearTimeout(scrollToBottomTimeoutRef.current);
      }

      // Set a small timeout to ensure DOM updates before scrolling
      scrollToBottomTimeoutRef.current = setTimeout(scrollToBottom, 10);
    }

    return () => {
      if (scrollToBottomTimeoutRef.current) {
        clearTimeout(scrollToBottomTimeoutRef.current);
      }
    };
  }, [result, isLoading, scrollToBottom]);

  // Handle final result
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
        // Remove potential placeholder and add complete message
        const historyWithoutPartial = prevHistory.filter(
          (msg) => !(msg.role === 'assistant' && msg.content === ''),
        );
        return [
          ...historyWithoutPartial,
          { role: 'assistant', content: result },
        ];
      });
      setCurrentRequest(null);
      responseAddedRef.current = true;

      // Force scroll after final message is added
      setTimeout(scrollToBottom, 50);
    }

    // Reset flag during loading of a new response
    if (isLoading && currentRequest && !responseAddedRef.current) {
      responseAddedRef.current = false;
    }
  }, [isLoading, result, finishReason, currentRequest, jobId, scrollToBottom]);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    // Ensure scroll when opening chat
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
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
      };

      setCurrentRequest(newRequest);
      responseAddedRef.current = false;

      // Force immediate scroll after sending message
      requestAnimationFrame(scrollToBottom);
    },
    [
      history,
      isLoading,
      currentRequest,
      isChatOpen,
      defaultPrompt,
      model,
      temperature,
      max_tokens,
      top_p,
      scrollToBottom,
    ],
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
    <ChatContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed inset-0 w-full h-full flex flex-col items-center justify-center z-40 backdrop-blur-md p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="relative w-full max-w-4xl h-[calc(90vh-2rem)] flex flex-col">
              <ScrollArea className="flex-grow w-full overflow-y-auto">
                <div
                  ref={viewportRef}
                  className="h-full w-full py-4 space-y-4 overflow-y-auto"
                >
                  {history.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg inline-block max-w-[85%] break-words shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100/60 text-gray-900 dark:bg-gray-700/60 dark:text-gray-100'
                        }`}
                      >
                        <MarkdownView content={msg.content} />
                      </div>
                    </div>
                  ))}

                  {isLoading && currentRequest && result && (
                    <div className="flex justify-start">
                      <div className="px-4 py-2 rounded-lg inline-block max-w-[85%] break-words bg-gray-100/60 text-gray-900 dark:bg-gray-700/60 dark:text-gray-100 shadow-sm">
                        <MarkdownView content={result} />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex justify-center pt-2">
                      <p className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded text-sm shadow-sm">
                        Error: {error.message || 'An error occurred.'}
                      </p>
                    </div>
                  )}

                  <div className="h-4" />
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ChatContext.Provider>
  );
};
