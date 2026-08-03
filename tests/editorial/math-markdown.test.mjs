import assert from "node:assert/strict";
import test from "node:test";

import {
  mathBlockTokenizer,
  mathInlineTokenizer,
} from "../../lib/editorial/math-markdown.ts";

test("block math preserves commands, subscripts and line breaks", () => {
  const source = String.raw`$$
\min_{u_0,\ldots,u_{N-1}}
\sum_{k=0}^{N-1}
\left(\lVert x_k-x_k^{ref}\rVert_Q^2-\lVert u_k\rVert_R^2\right)
$$
`;
  const token = mathBlockTokenizer.tokenize(source, [], {});

  assert.equal(
    token?.attributes?.latex,
    String.raw`\min_{u_0,\ldots,u_{N-1}}
\sum_{k=0}^{N-1}
\left(\lVert x_k-x_k^{ref}\rVert_Q^2-\lVert u_k\rVert_R^2\right)`,
  );
});

test("inline math preserves subscripts", () => {
  const token = mathInlineTokenizer.tokenize(String.raw`$x_k^{ref}$ rest`, [], {});
  assert.equal(token?.attributes?.latex, String.raw`x_k^{ref}`);
  assert.equal(token?.raw, String.raw`$x_k^{ref}$`);
});
