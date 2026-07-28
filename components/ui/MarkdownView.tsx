"use client";

import { Check, Clipboard, Loader2 } from "lucide-react";
import Image from "next/image";
import type { JSX } from "react";
import type React from "react";
import { useState } from "react";
import ReactMarkdown, { type ExtraProps, type Options } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { codeTheme } from "@/components/ui/codeTheme";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { cn } from "@/lib/utils";

interface MarkdownViewProps {
  content: string;
  loading?: boolean;
  className?: string;
}

type CodeProps = JSX.IntrinsicElements["code"] & ExtraProps;

/** A fenced code block: language label, copy button, warm syntax theme. */
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing useful to show the reader */
    }
  };

  return (
    <div className="my-7 overflow-hidden rounded-4 bg-[#221c17]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="t-eyebrow text-white/45">{language}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="grid size-7 place-items-center rounded-2 text-white/50 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Clipboard className="size-3.5" />
          )}
        </button>
      </div>
      <SyntaxHighlighter style={codeTheme} language={language} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * Markdown rendering. Element styling lives in `.prose-paper` in globals.css;
 * this file only handles what genuinely needs React: syntax-highlighted code,
 * Mermaid diagrams, and next/image.
 */
const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  loading = false,
  className,
}) => {
  const components: Options["components"] = {
    img: ({ src, alt, width, height }) => {
      if (typeof src !== "string") return null;
      const w = typeof width === "string" ? parseInt(width, 10) : width;
      const h = typeof height === "string" ? parseInt(height, 10) : height;
      return (
        <Image
          src={src}
          alt={alt || ""}
          width={w ?? 1280}
          height={h ?? 720}
          sizes="(max-width: 768px) 92vw, 42rem"
          className="mx-auto h-auto w-full"
        />
      );
    },

    table: ({ children }) => (
      <div className="my-7 w-full overflow-x-auto">
        <table>{children}</table>
      </div>
    ),

    code: ({ node, className: codeClassName, children }: CodeProps) => {
      const match = /language-(\w+)/.exec(codeClassName || "");
      const code = String(children).replace(/\n$/, "");

      type MdNode = {
        position?: { start: { line: number }; end: { line: number } };
        value?: string;
      };
      const mdNode = node as unknown as MdNode | undefined;
      const isBlock =
        mdNode?.position?.start.line !== mdNode?.position?.end.line ||
        (mdNode?.value?.includes("\n") ?? false);

      if (!isBlock || !match) {
        return <code className={codeClassName}>{children}</code>;
      }

      if (match[1] === "mermaid") {
        return (
          <div className="my-7">
            <MermaidDiagram source={code} />
          </div>
        );
      }

      return <CodeBlock code={code} language={match[1]} />;
    },
  };

  return (
    <div className={cn("prose-paper", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
      {loading ? (
        <span className="inline-flex items-center pl-2 align-middle">
          <Loader2 className="size-4 animate-spin text-ink-faint" />
        </span>
      ) : null}
    </div>
  );
};

export default MarkdownView;
