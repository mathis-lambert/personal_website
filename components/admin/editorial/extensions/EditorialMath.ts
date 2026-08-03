import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import { InputRule, nodePasteRule } from "@tiptap/core";

import {
  BLOCK_MATH_INPUT_REGEX,
  BLOCK_MATH_PASTE_REGEX,
  INLINE_MATH_INPUT_REGEX,
  INLINE_MATH_PASTE_REGEX,
} from "@/lib/editorial/math";

export const EditorialInlineMath = InlineMath.extend({
  addInputRules() {
    return [
      new InputRule({
        find: INLINE_MATH_INPUT_REGEX,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ latex: match[1] }),
          );
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: INLINE_MATH_PASTE_REGEX,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1] }),
      }),
    ];
  },
});

export const EditorialBlockMath = BlockMath.extend({
  addInputRules() {
    return [
      new InputRule({
        find: BLOCK_MATH_INPUT_REGEX,
        handler: ({ state, range, match }) => {
          const $from = state.doc.resolve(range.from);
          const node = this.type.create({ latex: match[1] });
          const consumesParagraph =
            $from.depth > 0 &&
            $from.parent.isTextblock &&
            range.from === $from.start() &&
            range.to === $from.end();
          const canReplaceParagraph =
            consumesParagraph &&
            $from
              .node(-1)
              .canReplaceWith($from.index(-1), $from.indexAfter(-1), this.type);

          state.tr.replaceWith(
            canReplaceParagraph ? $from.before() : range.from,
            canReplaceParagraph ? $from.after() : range.to,
            node,
          );
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: BLOCK_MATH_PASTE_REGEX,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1].trim() }),
      }),
    ];
  },
});
