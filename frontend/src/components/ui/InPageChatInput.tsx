import React, {
  FormEvent,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { ArrowUp, Loader2, X } from 'lucide-react'; // Import X icon
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';

interface ChatInputProps {
  placeholder?: string;
}

const InPageChatInput: React.FC<ChatInputProps> = ({
  placeholder = 'Poser une question',
}) => {
  const [message, setMessage] = useState<string>('');
  const { sendMessage, isLoading, isChatOpen, closeChat } = useChat();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const minHeight = 32;
  const maxHeight = 200;

  const adjustTextAreaHeight = useCallback(() => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = 'auto';
      const newHeight = Math.max(
        minHeight,
        Math.min(textArea.scrollHeight, maxHeight),
      );
      textArea.style.height = `${newHeight}px`;
      textArea.style.lineHeight =
        textArea.value.trim() === '' ? `${minHeight}px` : 'normal';
    }
  }, [minHeight, maxHeight]);

  useEffect(() => {
    adjustTextAreaHeight();
  }, [message, adjustTextAreaHeight]);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      sendMessage(trimmedMessage);
      setMessage('');
      const textArea = textAreaRef.current;
      if (textArea) {
        textArea.style.height = `${minHeight}px`;
        textArea.style.lineHeight = `${minHeight}px`;
      }
    }
  }, [message, sendMessage, minHeight]);

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

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center space-x-2 w-full px-4">
      <motion.div
        className="w-full max-w-lg bg-white/10 border border-white shadow-lg backdrop-blur-md rounded-xl p-2 dark:bg-gray-800/10 dark:border-white/20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end w-full"
        >
          <textarea
            ref={textAreaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className="
              w-full
              pr-12
              pl-2
              resize-none
              overflow-y-auto
              bg-transparent
              border-none
              focus-visible:ring-0
              focus-visible:ring-offset-0
              placeholder:text-black/40
              outline-none
              scrollbar-thin
              scrollbar-thumb-slate-400
              scrollbar-track-transparent
              scrollbar-thumb-rounded-full
              scrollbar-track-rounded-full
              dark:placeholder:text-white/40
              dark:scrollbar-thumb-slate-600
              dark:scrollbar-track-transparent
              dark:scrollbar-thumb-rounded-full
              dark:scrollbar-track-rounded-full
              disabled:opacity-60
            "
            style={{
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
              height: `${minHeight}px`,
              lineHeight: message.trim() === '' ? `${minHeight}px` : 'normal',
              paddingBlock: message.trim() === '' ? `0` : '0.5rem',
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="
              absolute
              bottom-0
              right-0
              w-8 h-8
              bg-sky-500/50
              shadow-lg
              backdrop-blur-lg
              rounded-lg
              flex items-center justify-center
              hover:bg-sky-500/60
              text-xs
              disabled:opacity-50 disabled:cursor-not-allowed
              dark:bg-sky-600/50
              dark:hover:bg-sky-600/60
              transition-colors
              duration-200
              ease-in-out
            "
            disabled={isLoading || !message.trim()}
            aria-label="Envoyer le message"
          >
            {isLoading ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <ArrowUp size={16} className="text-white" />
            )}
          </Button>
        </form>
      </motion.div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="
                w-9 h-9
                bg-red-500/50
                hover:bg-red-500/70
                dark:bg-red-600/50
                dark:hover:bg-red-600/70
                text-white
                rounded-full
                shadow-lg
                backdrop-blur-lg
                flex items-center justify-center
                "
              onClick={handleCloseChat}
              aria-label="Fermer le chat"
            >
              <X size={18} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InPageChatInput;
