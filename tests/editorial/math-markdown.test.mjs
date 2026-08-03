import assert from "node:assert/strict";
import test from "node:test";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { MarkdownManager } from "@tiptap/markdown";

import {
  BLOCK_MATH_INPUT_REGEX,
  INLINE_MATH_INPUT_REGEX,
} from "../../lib/editorial/math.ts";

test("inline math is recognized as soon as the closing dollar is typed", () => {
  const match = INLINE_MATH_INPUT_REGEX.exec(String.raw`Here is $u_k$`);
  assert.equal(match?.[1], String.raw`u_k`);
});

test("block math keeps LaTeX commands and subscripts intact", () => {
  const match = BLOCK_MATH_INPUT_REGEX.exec(
    String.raw`$$\sum_{k=0}^{N-1}\lVert x_k\rVert_Q^2$$`,
  );
  assert.equal(match?.[1], String.raw`\sum_{k=0}^{N-1}\lVert x_k\rVert_Q^2`);
});

test("Markdown parsing and serialization preserve complete equations", () => {
  const manager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, BlockMath, InlineMath],
  });
  const markdown = String.raw`Here, $x_k$ follows $x_k^{ref}$.

$$
\min_{u_0,\ldots,u_{N-1}}
\sum_{k=0}^{N-1}
\left(
\lVert x_k-x_k^{ref}\rVert_Q^2
-
\lVert u_k\rVert_R^2
\right)
$$`;

  const document = manager.parse(markdown);
  const output = manager.serialize(document);

  assert.equal(output, markdown);
  assert.equal(document.content?.[0]?.content?.[1]?.type, "inlineMath");
  assert.equal(document.content?.[1]?.type, "blockMath");
});
