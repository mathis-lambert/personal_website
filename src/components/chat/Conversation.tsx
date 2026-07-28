"use client";

import type React from "react";
import { useEffect, useRef } from "react";

import AssistantMessage from "@/components/chat/AssistantMessage";
import UserMessage from "@/components/chat/UserMessage";
import { Eyebrow } from "@/components/ds";
import { useChat } from "@/hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";

const Conversation: React.FC = () => {
  const { messages, isLoading, error } = useChat();
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      viewportRef.current?.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 20);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  return (
    <ScrollArea ref={viewportRef} className="h-full w-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-32">
        {messages.length === 0 ? (
          <div className="py-16">
            <Eyebrow className="mb-4">No messages yet</Eyebrow>
            <p className="t-h3 measure">
              Ask about a project, a technical decision, or what I&apos;m
              looking for next.
            </p>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            {message.role === "user" ? (
              <UserMessage content={message.content} />
            ) : (
              <AssistantMessage
                content={message.content}
                isLoading={
                  isLoading && index === messages.length - 1 && !message.content
                }
              />
            )}
          </div>
        ))}

        {error ? (
          <p
            role="alert"
            className="rounded-3 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error.message || "Something went wrong. Try again."}
          </p>
        ) : null}
      </div>
    </ScrollArea>
  );
};

export default Conversation;
