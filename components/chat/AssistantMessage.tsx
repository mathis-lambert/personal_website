"use client";

import type React from "react";

import LoadingDots from "@/components/chat/LoadingDots";
import MarkdownView from "@/components/content/MarkdownView";

/** The assistant's turn: a paper surface, same as every other card. */
const AssistantMessage: React.FC<{ content: string; isLoading?: boolean }> = ({
  content,
  isLoading = false,
}) => (
  <div className="w-full max-w-3xl break-words rounded-4 rounded-bl-1 border border-line bg-paper-lift px-5 py-4">
    {isLoading && !content ? (
      <div className="py-1.5">
        <LoadingDots />
      </div>
    ) : (
      <MarkdownView content={content} />
    )}
  </div>
);

export default AssistantMessage;
