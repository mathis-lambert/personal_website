import type React from "react";

import MarkdownView from "@/components/ui/MarkdownView";

/** The visitor's turn: solid ink, so authorship is obvious at a glance. */
const UserMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="max-w-[85%] break-words rounded-4 rounded-br-1 bg-ink px-5 py-3 text-ink-invert [&_.prose-paper]:text-ink-invert">
    <MarkdownView content={content} />
  </div>
);

export default UserMessage;
