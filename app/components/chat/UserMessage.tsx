import React from "react";
import MarkdownView from "@/components/ui/MarkdownView";

interface UserMessageProps {
  content: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <div className="px-4 py-2.5 rounded-2xl inline-block max-w-[85%] break-words shadow-lg shadow-blue-900/30 bg-gradient-to-br from-sky-500 to-indigo-500 text-white border border-white/20 backdrop-blur-md">
      <MarkdownView content={content} />
    </div>
  );
};

export default UserMessage;
