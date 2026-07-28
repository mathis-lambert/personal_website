"use client";

import type React from "react";
import { useEffect } from "react";

import Conversation from "@/components/chat/Conversation";
import { Eyebrow, Page } from "@/components/ds";
import { useChat } from "@/hooks/useChat";

/** Full-screen reading surface for the conversation: paper, not tinted glass. */
const ChatPanel: React.FC = () => {
  const { isChatOpen, closeChat, openChat, toggleChat } = useChat();

  // Lock the page behind the panel while it's open.
  useEffect(() => {
    if (!isChatOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isChatOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isChatOpen) {
        closeChat();
        return;
      }

      if (event.defaultPrevented) return;

      const active = document.activeElement as HTMLElement | null;
      const inTextField =
        active?.isContentEditable ||
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA";
      if (inTextField) return;

      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && event.altKey) {
        if (key === "c") {
          event.preventDefault();
          openChat();
        } else if (key === "x") {
          event.preventDefault();
          toggleChat();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isChatOpen, closeChat, openChat, toggleChat]);

  // Kept mounted so opening and closing are both animated; `.overlay` handles
  // the fade and settle, and drops visibility so nothing here is focusable or
  // clickable while closed.
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio assistant"
      aria-hidden={!isChatOpen}
      data-open={isChatOpen}
      className="overlay fixed inset-0 z-[400] flex flex-col bg-paper/95 backdrop-blur-sm"
    >
      <div className="grain pointer-events-none" aria-hidden="true" />

      <Page className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between py-6">
          <Eyebrow brand>Portfolio assistant</Eyebrow>
          <Eyebrow className="hidden sm:flex">Esc to close</Eyebrow>
        </div>

        <div className="min-h-0 flex-1">
          <Conversation />
        </div>
      </Page>
    </div>
  );
};

export default ChatPanel;
