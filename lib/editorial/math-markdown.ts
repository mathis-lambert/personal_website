import type { MarkdownToken, MarkdownTokenizer } from "@tiptap/core";

export const MATH_BLOCK_TOKEN = "mathBlock";
export const MATH_INLINE_TOKEN = "mathInline";

export const mathBlockTokenizer: MarkdownTokenizer = {
  name: MATH_BLOCK_TOKEN,
  level: "block",
  start: (source) => source.search(/^\s*\$\$/m),
  tokenize(source) {
    const match = /^\s*\$\$[ \t]*\n?([\s\S]*?)\n?[ \t]*\$\$(?:\n|$)/.exec(source);
    if (!match) return;
    return { type: MATH_BLOCK_TOKEN, raw: match[0], attributes: { latex: match[1].trim() } } as MarkdownToken;
  },
};

export const mathInlineTokenizer: MarkdownTokenizer = {
  name: MATH_INLINE_TOKEN,
  level: "inline",
  start: (source) => source.search(/(?<!\\)\$(?!\$)/),
  tokenize(source) {
    const match = /^\$(?!\$)((?:\\.|[^$\n\\])+)\$/.exec(source);
    if (!match) return;
    return { type: MATH_INLINE_TOKEN, raw: match[0], attributes: { latex: match[1] } } as MarkdownToken;
  },
};
