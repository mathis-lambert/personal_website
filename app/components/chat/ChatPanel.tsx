"use client";
import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import Conversation from "@/components/chat/Conversation";

const ChatPanel: React.FC = () => {
  const { isChatOpen, closeChat, openChat, toggleChat } = useChat();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isChatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isChatOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeChat();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeChat]);

  // Macros to open/toggle chat (macOS: Cmd+Option+C/X, Windows: Ctrl+Alt+C/X)
  useEffect(() => {
    const isTextInput = (el: Element | null) => {
      if (!el) return false;
      const he = el as HTMLElement;
      const tag = he.tagName;
      return (
        he.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        !!he.closest('[role="textbox"]')
      );
    };

    const handleHotkeys = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isTextInput(document.activeElement)) return;

      const key = event.key.toLowerCase();
      const metaOrCtrl = event.metaKey || event.ctrlKey;

      // Open chat
      if (metaOrCtrl && event.altKey && key === "c") {
        event.preventDefault();
        openChat();
        return;
      }

      // Toggle chat
      if (metaOrCtrl && event.altKey && key === "x") {
        event.preventDefault();
        toggleChat();
      }
    };

    window.addEventListener("keydown", handleHotkeys);
    return () => window.removeEventListener("keydown", handleHotkeys);
  }, [openChat, toggleChat]);

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center z-40 backdrop-blur-xl bg-gradient-to-br from-slate-950/40 via-slate-900/20 to-sky-900/10 p-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="relative w-full max-w-4xl h-full flex flex-col bg-transparent pt-10 pb-5 lg:pt-14 lg:pb-10">
            <div className="flex-1 min-h-0">
              <Conversation />
            </div>
            <div className="absolute top-12 lg:top-14 left-4 sm:left-6 text-white/70 text-sm opacity-80 select-none hidden md:block">
              Esc to close
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;
