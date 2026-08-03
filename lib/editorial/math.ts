export type MathKind = "inline" | "block";

export type MathEditorRequest = {
  kind: MathKind;
  latex: string;
  pos?: number;
};

export const INLINE_MATH_INPUT_REGEX =
  /(?<!\\)(?<!\$)\$((?:\\.|[^$\n\\])+)\$$/;

export const BLOCK_MATH_INPUT_REGEX =
  /^\$\$\s*([^$\n]+?)\s*\$\$$/;

export const INLINE_MATH_PASTE_REGEX =
  /(?<!\\)(?<!\$)\$((?:\\.|[^$\n\\])+)\$(?!\$)/g;

export const BLOCK_MATH_PASTE_REGEX =
  /\$\$\s*([\s\S]+?)\s*\$\$/g;

export const DEFAULT_INLINE_MATH = "u_k";
export const DEFAULT_BLOCK_MATH = String.raw`\sum_{k=0}^{N-1} x_k`;
