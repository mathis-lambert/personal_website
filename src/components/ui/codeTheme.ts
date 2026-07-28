import type { CSSProperties } from "react";

/**
 * A warm syntax theme for code blocks.
 *
 * The previous setup used Prism's `oneDark`, whose slate-and-violet tokens
 * fought the warm palette everywhere they appeared. These hues sit in the same
 * 20–120 range as the rest of the system, so a code block reads as an inked
 * slab of the same document.
 *
 * Values are literal because `react-syntax-highlighter` inlines them as style
 * objects and cannot resolve CSS custom properties.
 */
const ink = "#f2e9dc";
const faint = "#9a8f80";
const clay = "#e08b62";
const olive = "#b7c088";
const ochre = "#e2bd77";
const sky = "#8fb3c9";

const token = (color: string, extra?: CSSProperties) => ({ color, ...extra });

export const codeTheme: Record<string, CSSProperties> = {
  'code[class*="language-"]': {
    color: ink,
    background: "none",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: "0.8125rem",
    lineHeight: 1.7,
    tabSize: 2,
    hyphens: "none",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
  },
  'pre[class*="language-"]': {
    color: ink,
    background: "none",
    margin: 0,
    padding: "1.25rem",
    overflow: "auto",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: "0.8125rem",
    lineHeight: 1.7,
  },

  comment: token(faint, { fontStyle: "italic" }),
  prolog: token(faint),
  doctype: token(faint),
  cdata: token(faint),
  punctuation: token("#b6a894"),

  property: token(clay),
  tag: token(clay),
  constant: token(clay),
  symbol: token(clay),
  deleted: token(clay),

  boolean: token(ochre),
  number: token(ochre),

  selector: token(olive),
  "attr-name": token(ochre),
  string: token(olive),
  char: token(olive),
  builtin: token(olive),
  inserted: token(olive),

  operator: token(sky),
  entity: token(sky, { cursor: "help" }),
  url: token(sky),
  variable: token(sky),

  atrule: token(ochre),
  "attr-value": token(olive),
  function: token(ochre),
  "class-name": token(ochre),

  keyword: token(clay),
  regex: token(ochre),
  important: token(clay, { fontWeight: "bold" }),
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
};
