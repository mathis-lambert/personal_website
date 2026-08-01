import type { CSSProperties } from "react";

/**
 * A restrained syntax theme for the neutral code surface.
 *
 * Values are literal because `react-syntax-highlighter` inlines them as style
 * objects and cannot resolve CSS custom properties.
 */
const ink = "#d8dee9";
const faint = "#737b87";
const coral = "#dc917f";
const green = "#a8bf9d";
const amber = "#d2b276";
const blue = "#91abc8";

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
  punctuation: token("#a7afb9"),

  property: token(coral),
  tag: token(coral),
  constant: token(coral),
  symbol: token(coral),
  deleted: token(coral),

  boolean: token(amber),
  number: token(amber),

  selector: token(green),
  "attr-name": token(amber),
  string: token(green),
  char: token(green),
  builtin: token(green),
  inserted: token(green),

  operator: token(blue),
  entity: token(blue, { cursor: "help" }),
  url: token(blue),
  variable: token(blue),

  atrule: token(amber),
  "attr-value": token(green),
  function: token(blue),
  "class-name": token(blue),

  keyword: token(coral),
  regex: token(amber),
  important: token(coral, { fontWeight: "bold" }),
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
};
