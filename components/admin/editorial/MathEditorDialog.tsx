"use client";

import katex from "katex";
import { SquareFunction, SquareSigma, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { MathEditorRequest } from "@/lib/editorial/math";

export function MathEditorDialog({
  request,
  onOpenChange,
  onSave,
  onDelete,
}: {
  request?: MathEditorRequest;
  onOpenChange: (open: boolean) => void;
  onSave: (latex: string) => void;
  onDelete: () => void;
}) {
  if (!request) return null;

  return (
    <MathEditorForm
      key={`${request.kind}:${request.pos ?? "new"}`}
      request={request}
      onOpenChange={onOpenChange}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

function MathEditorForm({
  request,
  onOpenChange,
  onSave,
  onDelete,
}: {
  request: MathEditorRequest;
  onOpenChange: (open: boolean) => void;
  onSave: (latex: string) => void;
  onDelete: () => void;
}) {
  const [latex, setLatex] = useState(request.latex);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isBlock = request.kind === "block";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const preview = useMemo(() => {
    if (!latex.trim()) return { html: "", error: "" };
    try {
      return {
        html: katex.renderToString(latex, {
          displayMode: isBlock,
          throwOnError: true,
          strict: "warn",
        }),
        error: "",
      };
    } catch (error) {
      return { html: "", error: (error as Error).message };
    }
  }, [isBlock, latex]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const value = latex.trim();
    if (!value || preview.error) return;
    onSave(value);
  };

  const Icon = isBlock ? SquareSigma : SquareFunction;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Icon className="size-5 text-brand" />
            {isBlock ? "Equation block" : "Inline equation"}
          </DialogTitle>
          <DialogDescription>
            Write LaTeX without delimiters. The editor stores it as{" "}
            <code>{isBlock ? "$$…$$" : "$…$"}</code> in Markdown.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="grid gap-5">
          <div
            className="grid min-h-28 place-items-center overflow-x-auto rounded-4 border border-line bg-paper px-5 py-6"
            aria-live="polite"
          >
            {preview.html ? (
              <div dangerouslySetInnerHTML={{ __html: preview.html }} />
            ) : (
              <span className="text-sm text-ink-faint">
                {preview.error ? "Fix the LaTeX below to render a preview." : "The preview appears here."}
              </span>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="editorial-latex-source" className="t-eyebrow text-ink-muted">
              LaTeX source
            </label>
            <Textarea
              ref={inputRef}
              id="editorial-latex-source"
              value={latex}
              onChange={(event) => setLatex(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={isBlock ? 7 : 3}
              spellCheck={false}
              placeholder={isBlock ? String.raw`\sum_{k=0}^{N-1} x_k` : "u_k"}
              aria-invalid={Boolean(preview.error)}
              className="resize-y bg-paper font-mono text-sm leading-relaxed"
            />
            {preview.error ? (
              <p role="alert" className="text-xs font-bold text-brand">
                {preview.error}
              </p>
            ) : (
              <p className="text-xs text-ink-faint">Save with Ctrl/⌘ + Enter.</p>
            )}
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <div>
              {request.pos !== undefined ? (
                <Button type="button" variant="ghost" onClick={onDelete}>
                  <Trash2 />
                  Delete
                </Button>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!latex.trim() || Boolean(preview.error)}>
                {request.pos !== undefined ? "Update equation" : "Insert equation"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
