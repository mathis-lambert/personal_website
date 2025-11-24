"use client";
import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AssistantMessage from "@/components/chat/AssistantMessage";
import UserMessage from "@/components/chat/UserMessage";
import { useChat } from "@/hooks/useChat";

const Conversation: React.FC = () => {
  const {
    messages,
    isLoading,
    streamingResult,
    streamingReasoning,
    streamingReasoningContent,
    error,
  } = useChat();
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const id = setTimeout(scrollToBottom, 10);
    return () => clearTimeout(id);
  }, [messages, streamingResult, isLoading]);

  return (
    <ScrollArea className="flex-grow w-full overflow-y-auto">
      <div
        ref={viewportRef}
        className="h-full w-full py-4 space-y-4 overflow-y-auto"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <UserMessage content={msg.content} />
            ) : (
              <AssistantMessage
                content={msg.content}
                reasoning={msg.reasoning}
                reasoning_content={msg.reasoning_content}
              />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <AssistantMessage
              content={streamingResult}
              reasoning={streamingReasoning}
              reasoning_content={streamingReasoningContent}
              isLoading={!streamingResult}
            />
          </div>
        )}

        {error && (
          <div className="flex justify-center pt-2">
            <p className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded text-sm shadow-sm">
              Error: {error.message || "An error occurred."}
            </p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </ScrollArea>
  );
};

export default Conversation;
