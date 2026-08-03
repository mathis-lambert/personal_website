import type { Editor } from "@tiptap/react";
import {
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  SquareFunction,
  SquareSigma,
  Table2,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import {
  DEFAULT_BLOCK_MATH,
  DEFAULT_INLINE_MATH,
  type MathEditorRequest,
} from "@/lib/editorial/math";

type SlashCommandContext = {
  editor: Editor;
  range: { from: number; to: number };
  openMediaLibrary: () => void;
  openMathEditor: (request: MathEditorRequest) => void;
};

export type SlashCommand = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
  run: (context: SlashCommandContext) => void;
};

const chainAt = ({ editor, range }: SlashCommandContext) =>
  editor.chain().focus().deleteRange(range);

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "paragraph",
    label: "Text",
    description: "Continue with a plain paragraph",
    keywords: ["paragraph", "text", "body"],
    icon: Pilcrow,
    run: (context) => chainAt(context).setParagraph().run(),
  },
  {
    id: "heading-2",
    label: "Heading 2",
    description: "Start a main section",
    keywords: ["heading", "title", "h2"],
    icon: Heading2,
    run: (context) => chainAt(context).setHeading({ level: 2 }).run(),
  },
  {
    id: "heading-3",
    label: "Heading 3",
    description: "Start a subsection",
    keywords: ["heading", "subtitle", "h3"],
    icon: Heading3,
    run: (context) => chainAt(context).setHeading({ level: 3 }).run(),
  },
  {
    id: "bullet-list",
    label: "Bullet list",
    description: "Create an unordered list",
    keywords: ["bullet", "list", "unordered"],
    icon: List,
    run: (context) => chainAt(context).toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    label: "Numbered list",
    description: "Create an ordered list",
    keywords: ["number", "list", "ordered"],
    icon: ListOrdered,
    run: (context) => chainAt(context).toggleOrderedList().run(),
  },
  {
    id: "quote",
    label: "Quote",
    description: "Emphasize a quotation",
    keywords: ["quote", "blockquote"],
    icon: Quote,
    run: (context) => chainAt(context).setBlockquote().run(),
  },
  {
    id: "code",
    label: "Code block",
    description: "Insert a fenced code block",
    keywords: ["code", "fence", "snippet"],
    icon: Code2,
    run: (context) => chainAt(context).setCodeBlock().run(),
  },
  {
    id: "inline-equation",
    label: "Inline equation",
    description: "Insert LaTeX inside the current paragraph",
    keywords: ["equation", "formula", "math", "latex", "inline"],
    icon: SquareFunction,
    run: (context) => {
      chainAt(context).run();
      context.openMathEditor({ kind: "inline", latex: DEFAULT_INLINE_MATH });
    },
  },
  {
    id: "equation-block",
    label: "Equation block",
    description: "Insert a centered display equation",
    keywords: ["equation", "formula", "math", "latex", "block", "display"],
    icon: SquareSigma,
    run: (context) => {
      chainAt(context).run();
      context.openMathEditor({ kind: "block", latex: DEFAULT_BLOCK_MATH });
    },
  },
  {
    id: "mermaid",
    label: "Mermaid diagram",
    description: "Edit and render a diagram inline",
    keywords: ["mermaid", "diagram", "flowchart", "graph"],
    icon: Workflow,
    run: (context) =>
      chainAt(context).setCodeBlock({ language: "mermaid" }).run(),
  },
  {
    id: "table",
    label: "Table",
    description: "Insert a table with a header row",
    keywords: ["table", "grid", "data", "rows", "columns"],
    icon: Table2,
    run: (context) =>
      chainAt(context)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Insert a horizontal rule",
    keywords: ["divider", "separator", "rule", "hr"],
    icon: Minus,
    run: (context) => chainAt(context).setHorizontalRule().run(),
  },
  {
    id: "image",
    label: "Image",
    description: "Choose or upload an optimized image",
    keywords: ["image", "photo", "media", "upload"],
    icon: ImagePlus,
    run: (context) => {
      chainAt(context).run();
      context.openMediaLibrary();
    },
  },
];

export const filterSlashCommands = (query: string) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((command) =>
    [command.label, ...command.keywords].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  );
};
