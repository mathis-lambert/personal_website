"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Check, ExternalLink, Link2, Unlink } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const normalizeHref = (value: string) => {
  const href = value.trim();
  if (!href || /^(\/|#|\?)/.test(href)) return href;
  if (!/^[a-z][a-z\d+.-]*:/i.test(href)) return `https://${href}`;

  const protocol = href.slice(0, href.indexOf(":")).toLowerCase();
  if (!["http", "https", "mailto", "tel"].includes(protocol)) {
    throw new Error("Use an http, https, mailto or tel link");
  }
  return href;
};

export function LinkBubbleMenu({
  editor,
  requested,
  onRequestedChange,
}: {
  editor: Editor;
  requested: boolean;
  onRequestedChange: (open: boolean) => void;
}) {
  const [href, setHref] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncLink = () => {
      const currentHref = editor.isActive("link")
        ? String(editor.getAttributes("link").href ?? "")
        : "";
      setHref(currentHref);
      setError("");
      if (editor.isActive("link")) {
        window.requestAnimationFrame(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        });
      } else {
        onRequestedChange(false);
      }
    };

    editor.on("selectionUpdate", syncLink);
    return () => {
      editor.off("selectionUpdate", syncLink);
    };
  }, [editor, onRequestedChange]);

  useEffect(() => {
    if (!requested) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [requested]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    try {
      const nextHref = normalizeHref(href);
      if (!nextHref) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: nextHref })
          .run();
        setHref(nextHref);
      }
      setError("");
      onRequestedChange(false);
    } catch (linkError) {
      setError((linkError as Error).message);
    }
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setHref("");
    setError("");
    onRequestedChange(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="editorial-link-menu"
      shouldShow={({ editor: current }) =>
        requested || current.isActive("link")
      }
      options={{ placement: "top", offset: 10, flip: true, shift: true }}
      className="w-[min(25rem,calc(100vw-1.5rem))]"
    >
      <form
        onSubmit={save}
        className="rounded-4 border border-line bg-paper-lift p-2 shadow-lift-2"
      >
        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              ref={inputRef}
              value={href}
              onChange={(event) => {
                setHref(event.target.value);
                setError("");
              }}
              aria-label="Link URL"
              placeholder="https://example.com"
              className="h-10 rounded-full border-line bg-paper pl-9 pr-3 font-mono text-xs"
            />
          </div>
          <Button type="submit" size="icon" aria-label="Save link" title="Save link">
            <Check />
          </Button>
          {editor.isActive("link") ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open link"
                title="Open link"
                disabled={!href.trim()}
                onClick={() => {
                  try {
                    const nextHref = normalizeHref(href);
                    if (nextHref) {
                      window.open(nextHref, "_blank", "noopener,noreferrer");
                    }
                  } catch (linkError) {
                    setError((linkError as Error).message);
                  }
                }}
              >
                <ExternalLink />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove link"
                title="Remove link"
                onClick={remove}
              >
                <Unlink />
              </Button>
            </>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="px-3 pt-2 text-xs font-bold text-brand">
            {error}
          </p>
        ) : null}
      </form>
    </BubbleMenu>
  );
}
