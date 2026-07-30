"use client";

import { ArrowUp, Loader2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type React from "react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 200;

/** The persistent ask bar: paper surface, brand send button. */
const FloatingChatInput: React.FC<{ placeholder?: string }> = ({
  placeholder = "Ask me anything",
}) => {
  const [message, setMessage] = useState("");
  const { sendMessage, isLoading, isChatOpen, closeChat } = useChat();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname() || "/";
  const [nearFooter, setNearFooter] = useState(false);

  // Get out of the way once the footer comes into view.
  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNearFooter(Boolean(entry?.isIntersecting)),
      { threshold: 0.01 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // Modern browsers size a textarea to its content natively; where they do,
  // measuring in JS is not just redundant but actively wrong (see below).
  const nativeAutosize =
    typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content");

  const resize = useCallback(() => {
    const node = textAreaRef.current;
    if (!node || nativeAutosize) return;
    node.style.height = "0px";
    node.style.height = `${Math.max(MIN_HEIGHT, Math.min(node.scrollHeight, MAX_HEIGHT))}px`;
  }, [nativeAutosize]);

  // Re-measure whenever the field's width changes, not only when the text does.
  // On mount the flex row hasn't resolved yet and the textarea reports a 57px
  // width, so the placeholder "wraps" over a dozen phantom lines and the bar
  // opens at its 200px maximum. Observing the width fixes that at the source.
  useEffect(() => {
    const node = textAreaRef.current;
    if (!node || nativeAutosize) return;

    const observer = new ResizeObserver(() => resize());
    observer.observe(node);
    return () => observer.disconnect();
  }, [nativeAutosize, resize]);

  useEffect(resize, [message, resize]);

  useEffect(() => {
    if (isChatOpen) textAreaRef.current?.focus();
  }, [isChatOpen]);

  const send = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed, pathname);
    setMessage("");
    textAreaRef.current?.focus();
  }, [message, isLoading, sendMessage, pathname]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  // While the chat is open the composer is the only way to reply, so it
  // outranks the panel's z-index and the footer visibility observer.
  const hidden = nearFooter && !isChatOpen;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[450] flex justify-center px-4 pb-5 transition-[opacity,transform] duration-300 ease-(--ease-paper)",
        hidden ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
      )}
      aria-hidden={hidden}
    >
      <div className="pointer-events-auto flex w-full max-w-xl items-end gap-2">
        <form
          onSubmit={onSubmit}
          className="glass relative flex-1 rounded-full p-1.5 transition-colors duration-200 ease-(--ease-paper) focus-within:border-brand-quiet"
        >
          <textarea
            ref={textAreaRef}
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            readOnly={isLoading}
            aria-label="Ask the portfolio assistant"
            style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
            // 16px on a phone, or iOS zooms the page in on focus and leaves
            // the layout distorted. Back to 14px once there is a pointer.
            className="block w-full resize-none bg-transparent py-3 pl-4 pr-13 text-base leading-snug text-ink outline-none [field-sizing:content] placeholder:text-ink-faint md:text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || message.trim() === ""}
            aria-label="Send"
            className="absolute bottom-1.5 right-1.5 grid size-11 place-items-center rounded-full bg-brand text-brand-ink transition-[opacity,transform] duration-200 ease-(--ease-paper) hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-35"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </button>
        </form>

        {isChatOpen ? (
          <button
            type="button"
            onClick={() => {
              closeChat();
              setMessage("");
            }}
            aria-label="Close chat"
            className="glass grid size-14 shrink-0 place-items-center rounded-full text-ink-muted transition-colors duration-200 ease-(--ease-paper) hover:text-ink"
          >
            <X className="size-4.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default FloatingChatInput;
