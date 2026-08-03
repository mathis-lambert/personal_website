"use client";

import { InputRule, mergeAttributes, Node, nodePasteRule, type NodeViewProps } from "@tiptap/core";
import type { NodeType } from "@tiptap/pm/model";
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
const inlineMathInput = /(?<!\\)(?<!\$)\$((?:\\.|[^$\n\\])+)\$$/;
const blockMathInput = /^\$\$([^$\n]+)\$\$$/;
const inlineMathPaste = /(?<!\\)(?<!\$)\$((?:\\.|[^$\n\\])+)\$(?!\$)/g;
const blockMathPaste = /\$\$\s*([\s\S]+?)\s*\$\$/g;

const mathInputRule = (type: NodeType, find: RegExp) =>
  new InputRule({
    find: (text) => {
      const match = find.exec(text);
      if (!match) return null;
      return { text: match[0], index: match.index, data: { latex: match[1] } };
    },
    handler: ({ state, range, match }) => {
      state.tr.replaceWith(
        range.from,
        range.to,
        type.create({ latex: String(match.data?.latex ?? "") }),
      );
    },
  });

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
  addInputRules() {
    return [mathInputRule(this.type, blockMathInput)];
  },
  addPasteRules() {
    return [
      nodePasteRule({
        find: blockMathPaste,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1].trim() }),
      }),
    ];
  },
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
  addInputRules() {
    return [mathInputRule(this.type, inlineMathInput)];
  },
  addPasteRules() {
    return [
      nodePasteRule({
        find: inlineMathPaste,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1] }),
      }),
    ];
  },
  addNodeView: () => ReactNodeViewRenderer(MathNodeView),
});
