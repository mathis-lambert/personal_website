import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import Conversation from '@/components/chat/Conversation';

const ChatPanel: React.FC = () => {
  const { isChatOpen, closeChat, openChat, toggleChat } = useChat();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
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
      if (event.key === 'Escape') {
        closeChat();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
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
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        !!he.closest('[role="textbox"]')
      );
    };

    const handleHotkeys = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isTextInput(document.activeElement)) return;

      const key = event.key.toLowerCase();
      const metaOrCtrl = event.metaKey || event.ctrlKey;

      // Open chat
      if (metaOrCtrl && event.altKey && key === 'c') {
        event.preventDefault();
        openChat();
        return;
      }

      // Toggle chat
      if (metaOrCtrl && event.altKey && key === 'x') {
        event.preventDefault();
        toggleChat();
      }
    };

    window.addEventListener('keydown', handleHotkeys);
    return () => window.removeEventListener('keydown', handleHotkeys);
  }, [openChat, toggleChat]);

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          className="fixed inset-0 w-full h-full flex flex-col items-center justify-center z-40 backdrop-blur-md p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="relative w-full max-w-4xl h-full flex flex-col bg-transparent pt-10 pb-5 lg:pt-14 lg:pb-10">
            <Conversation />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;
