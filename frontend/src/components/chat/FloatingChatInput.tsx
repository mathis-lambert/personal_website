import React, {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ArrowUp, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import { useLocation } from 'react-router-dom';

interface ChatInputProps {
  placeholder?: string;
}

const FloatingChatInput: React.FC<ChatInputProps> = ({
  placeholder = 'Ask something',
}) => {
  const [message, setMessage] = useState<string>('');
  const { sendMessage, isLoading, isChatOpen, closeChat } = useChat();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const MIN_TEXTAREA_HEIGHT = 40;
  const MAX_TEXTAREA_HEIGHT = 200;

  const adjustTextAreaHeight = useCallback(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    textArea.style.height = 'auto';
    const newHeight = Math.max(
      MIN_TEXTAREA_HEIGHT,
      Math.min(textArea.scrollHeight, MAX_TEXTAREA_HEIGHT),
    );
    textArea.style.height = `${newHeight}px`;
    textArea.style.lineHeight =
      textArea.value.trim() === '' ? `${MIN_TEXTAREA_HEIGHT}px` : 'normal';
  }, [MIN_TEXTAREA_HEIGHT, MAX_TEXTAREA_HEIGHT]);

  useEffect(() => {
    adjustTextAreaHeight();
  }, [message, adjustTextAreaHeight]);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    sendMessage(trimmedMessage, location.pathname);
    setMessage('');

    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      textArea.style.lineHeight = `${MIN_TEXTAREA_HEIGHT}px`;
    }
  }, [message, sendMessage, MIN_TEXTAREA_HEIGHT, location.pathname]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleCloseChat = () => {
    closeChat();
    setMessage('');
  };

  const closeButtonSize = 'w-9 h-9';
  const isSendDisabled = isLoading || message.trim() === '';

  return (
    <div className="fixed bottom-2 md:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-end justify-center space-x-2 w-full px-4">
      <motion.div
        className="w-full max-w-lg bg-white/10 border border-white shadow-lg backdrop-blur-md rounded-3xl p-1 dark:bg-gray-800/10 dark:border-white/20 flex-shrink"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        layout
      >
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end w-full"
        >
          <textarea
            name="message"
            ref={textAreaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className="w-full pr-12 pl-2 resize-none overflow-y-auto bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-black/40 outline-none scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full dark:placeholder:text-white/40 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-transparent dark:scrollbar-thumb-rounded-full dark:scrollbar-track-rounded-full disabled:opacity-60"
            style={{
              minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
              maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
              paddingBlock: message.trim() === '' ? `0` : '0.5rem',
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute bottom-0 right-0 w-10 h-10 bg-sky-500/50 shadow-lg backdrop-blur-lg rounded-full flex items-center justify-center hover:bg-sky-500/60 text-xs disabled:opacity-50 disabled:cursor-not-allowed dark:bg-sky-600/50 dark:hover:bg-sky-600/60 transition-colors duration-200 ease-in-out"
            disabled={isSendDisabled}
            aria-label="Ask something"
          >
            {isLoading ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <ArrowUp size={16} className="text-white" />
            )}
          </Button>
        </form>
      </motion.div>

      <AnimatePresence initial={false}>
        {isChatOpen && (
          <div className={`${closeButtonSize} flex-shrink-0`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full h-full"
            >
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className={`absolute left-0 bottom-1.5 ${closeButtonSize} bg-red-500/50 hover:bg-red-500/70 dark:bg-red-600/50 dark:hover:bg-red-600/70 text-white rounded-full shadow-lg backdrop-blur-lg flex items-center justify-center transition-colors duration-200 ease-in-out`}
                onClick={handleCloseChat}
                aria-label="Close chat"
              >
                <X size={18} />
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingChatInput;
