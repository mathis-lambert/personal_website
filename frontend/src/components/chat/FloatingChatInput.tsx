import React, {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ArrowUp, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
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

  const [hiddenByFooter, setHiddenByFooter] = useState(false);

  // Observe footer visibility to hide input near footer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const footer = document.getElementById('site-footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHiddenByFooter(entry.isIntersecting),
      { root: null, threshold: 0.01, rootMargin: '0px 0px 2px 0px' },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const adjustTextAreaHeight = useCallback(() => {
    const ta = textAreaRef.current;
    if (!ta) return;

    const isEmpty = ta.value.trim() === '';

    if (isEmpty) {
      // lock to a single-line box so placeholder is vertically centered
      ta.style.lineHeight = `${MIN_TEXTAREA_HEIGHT}px`;
      ta.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      return;
    }

    // content present: autosize
    ta.style.lineHeight = 'normal';
    ta.style.height = 'auto';
    const newHeight = Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT);
    ta.style.height = `${Math.max(MIN_TEXTAREA_HEIGHT, newHeight)}px`;
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
      textArea.focus();
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
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
    requestAnimationFrame(() => {
      const ta = textAreaRef.current;
      if (ta) {
        ta.value = '';
        ta.style.lineHeight = `${MIN_TEXTAREA_HEIGHT}px`;
        ta.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      }
    });
  };

  // call sizing again whenever the input becomes visible again
  useEffect(() => {
    if (!hiddenByFooter) requestAnimationFrame(adjustTextAreaHeight);
  }, [hiddenByFooter, adjustTextAreaHeight]);

  useEffect(() => {
    if (isChatOpen) textAreaRef.current?.focus();
  }, [isChatOpen]);

  const closeButtonSize = `${isChatOpen ? 'w-9 h-9' : 'w-0 h-0'}`;
  const isSendDisabled = isLoading || message.trim() === '';

  return (
    <AnimatePresence initial={false}>
      {!hiddenByFooter && (
        <motion.div
          key="floating-chat-input"
          className="fixed bottom-4 md:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-end justify-center w-full px-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          layout="position"
        >
          <LayoutGroup>
            <div
              className={`flex items-end justify-center px-1 w-full ${isChatOpen ? 'gap-2' : ''}`}
            >
              {/* Input card */}
              <motion.div
                className="w-full max-w-lg bg-white/10 border border-white shadow-lg backdrop-blur-md rounded-3xl p-1 dark:bg-gray-800/10 dark:border-white/20 flex-shrink"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
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
                    readOnly={isLoading}
                    aria-disabled={isLoading}
                    className="w-full pr-12 pl-2 resize-none overflow-y-auto bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-black/40 outline-none scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent scrollbar-thumb-rounded-full dark:placeholder:text-white/40 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-transparent dark:scrollbar-thumb-rounded-full disabled:opacity-60"
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
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="text-white animate-spin" />
                    ) : (
                      <ArrowUp size={16} className="text-white" />
                    )}
                  </Button>
                </form>
              </motion.div>

              {/* Persistent slot to avoid layout shift */}
              <div className={`${closeButtonSize} flex-shrink-0 relative`}>
                <AnimatePresence mode="wait" initial={false}>
                  {isChatOpen && (
                    <motion.div
                      key="close-button"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute left-0 bottom-1.5 w-full h-full"
                    >
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className={`w-full h-full bg-red-500/50 hover:bg-red-500/70 dark:bg-red-600/50 dark:hover:bg-red-600/70 text-white rounded-full shadow-lg backdrop-blur-lg flex items-center justify-center transition-colors duration-200 ease-in-out`}
                        onClick={handleCloseChat}
                        aria-label="Close chat"
                      >
                        <X size={18} />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </LayoutGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingChatInput;
