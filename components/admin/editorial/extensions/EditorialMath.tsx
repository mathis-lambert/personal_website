"use client";

import { mergeAttributes, Node, type NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import katex from "katex";
import { useMemo } from "react";
import { mathBlockTokenizer, mathInlineTokenizer, MATH_BLOCK_TOKEN, MATH_INLINE_TOKEN } from "@/lib/editorial/math-markdown";

function MathNodeView({ node, updateAttributes }: NodeViewProps) {
  const latex = String(node.attrs.latex ?? "");
  const displayMode = node.type.name === MATH_BLOCK_TOKEN;
  const html = useMemo(() => katex.renderToString(latex, { displayMode, throwOnError: false, strict: "warn" }), [displayMode, latex]);
  return (
    <NodeViewWrapper as={displayMode ? "div" : "span"} className={displayMode ? "editorial-math-block" : "editorial-math-inline"}>
      <span className="editorial-math-preview" contentEditable={false} dangerouslySetInnerHTML={{ __html: html }} />
      {displayMode ? (
        <textarea value={latex} onChange={(event) => updateAttributes({ latex: event.target.value })} aria-label="Block LaTeX" rows={Math.max(2, latex.split("\n").length)} spellCheck={false} />
      ) : (
        <input value={latex} onChange={(event) => updateAttributes({ latex: event.target.value })} aria-label="Inline LaTeX" spellCheck={false} />
      )}
    </NodeViewWrapper>
  );
}

const mathAttributes = { latex: { default: "" } };

export const EditorialMathBlock = Node.create({
  name: MATH_BLOCK_TOKEN,
  group: "block",
  atom: true,
  isolating: true,
  addAttributes: () => mathAttributes,
  parseHTML: () => [{ tag: "div[data-math-block]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-math-block": "" })],
  markdownTokenName: MATH_BLOCK_TOKEN,
  markdownTokenizer: mathBlockTokenizer,
  parseMarkdown: (token, helpers) => helpers.createNode(MATH_BLOCK_TOKEN, token.attributes),
  renderMarkdown: (node) => `$$\n${node.attrs?.latex ?? ""}\n$$`,
  addNodeView: () => ReactNodeViewRenderer(MathNodeView),
});

export const EditorialMathInline = Node.create({
  name: MATH_INLINE_TOKEN,
  group: "inline",
  inline: true,
  atom: true,
  addAttributes: () => mathAttributes,
  parseHTML: () => [{ tag: "span[data-math-inline]" }],
  renderHTML: ({ HTMLAttributes }) => ["span", mergeAttributes(HTMLAttributes, { "data-math-inline": "" })],
  markdownTokenName: MATH_INLINE_TOKEN,
  markdownTokenizer: mathInlineTokenizer,
  parseMarkdown: (token, helpers) => helpers.createNode(MATH_INLINE_TOKEN, token.attributes),
  renderMarkdown: (node) => `$${node.attrs?.latex ?? ""}$`,
  addNodeView: () => ReactNodeViewRenderer(MathNodeView),
});
