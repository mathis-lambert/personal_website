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
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const id = setTimeout(scrollToBottom, 20);
    return () => clearTimeout(id);
  }, [messages, streamingResult, isLoading]);

  return (
    <ScrollArea ref={viewportRef} className="flex-1 w-full h-full min-h-0">
      <div className="h-full w-full space-y-4 px-2 sm:px-4 py-4 pb-28">
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

        <div className="h-6" />
      </div>
    </ScrollArea>
  );
};

export default Conversation;
