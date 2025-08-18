import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownView from '@/components/ui/MarkdownView';
import { useChat } from '@/hooks/useChat';

const Conversation: React.FC = () => {
  const { history, isLoading, streamingResult, error } = useChat();
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const id = setTimeout(scrollToBottom, 10);
    return () => clearTimeout(id);
  }, [history, streamingResult, isLoading]);

  return (
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
              className={`px-4 py-2 rounded-lg inline-block max-w-[85%] break-words shadow-sm ${msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100/60 text-gray-900 dark:bg-gray-700/60 dark:text-gray-100'
                }`}
            >
              <MarkdownView content={msg.content} />
            </div>
          </div>
        ))}

        {isLoading && streamingResult && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg inline-block max-w-[85%] break-words bg-gray-100/60 text-gray-900 dark:bg-gray-700/60 dark:text-gray-100 shadow-sm">
              <MarkdownView content={streamingResult} />
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
  );
};

export default Conversation;
