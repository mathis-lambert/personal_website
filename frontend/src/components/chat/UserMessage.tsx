import React from 'react';
import MarkdownView from '@/components/ui/MarkdownView';

interface UserMessageProps {
  content: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <div className="px-4 py-2 rounded-lg inline-block max-w-[85%] break-words shadow-sm bg-blue-600 text-white">
      <MarkdownView content={content} />
    </div>
  );
};

export default UserMessage;
