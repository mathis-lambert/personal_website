"use client";
import React from "react";
import MarkdownView from "@/components/ui/MarkdownView";
import LoadingDots from "@/components/ui/LoadingDots";

interface AssistantMessageProps {
  content: string;
  isLoading?: boolean;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  isLoading = false,
}) => {
  return (
    <div className="px-4 py-3 rounded-2xl inline-block w-full max-w-3xl break-words bg-gradient-to-br from-slate-50/80 to-white/60 text-slate-900 border border-white/50 shadow-lg shadow-slate-900/20 backdrop-blur-lg dark:from-slate-800/70 dark:to-slate-900/70 dark:text-slate-50 dark:border-white/10">
      {isLoading && !content ? (
        <div className="py-2">
          <LoadingDots />
        </div>
      ) : (
        <MarkdownView content={content} />
      )}
    </div>
  );
};

export default AssistantMessage;
