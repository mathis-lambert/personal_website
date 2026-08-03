"use client";

import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { getMarkRange } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import { TextSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  SquareFunction,
  SquareSigma,
  Table2,
  Undo2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { uploadMediaAsset } from "@/api/media";
import { EditorialCodeBlock } from "@/components/admin/editorial/extensions/EditorialCodeBlock";
import {
  EditorialBlockMath,
  EditorialInlineMath,
} from "@/components/admin/editorial/extensions/EditorialMath";
import {
  EditorialTable,
  EditorialTableCell,
  EditorialTableHeader,
  EditorialTableRow,
} from "@/components/admin/editorial/extensions/EditorialTable";
import { MathEditorDialog } from "@/components/admin/editorial/MathEditorDialog";
import { LinkBubbleMenu } from "@/components/admin/editorial/LinkBubbleMenu";
import { MediaLibraryDialog } from "@/components/admin/editorial/MediaLibraryDialog";
import { SlashCommandMenu } from "@/components/admin/editorial/SlashCommandMenu";
import { TableBubbleMenu } from "@/components/admin/editorial/TableBubbleMenu";
import { Toggle } from "@/components/ui/toggle";
import {
  DEFAULT_BLOCK_MATH,
  DEFAULT_INLINE_MATH,
  type MathEditorRequest,
  type MathKind,
} from "@/lib/editorial/math";
import { mediaAssetUrl, type MediaAsset } from "@/types/media";

export function RichMarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [linkMenuRequested, setLinkMenuRequested] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mathEditor, setMathEditor] = useState<MathEditorRequest>();
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: { openOnClick: false },
      }),
      EditorialCodeBlock,
      EditorialBlockMath.configure({
        katexOptions: { displayMode: true, throwOnError: false },
        onClick: (node, pos) =>
          setMathEditor({ kind: "block", latex: String(node.attrs.latex), pos }),
      }),
      EditorialInlineMath.configure({
        katexOptions: { displayMode: false, throwOnError: false },
        onClick: (node, pos) =>
          setMathEditor({ kind: "inline", latex: String(node.attrs.latex), pos }),
      }),
      EditorialTable,
      EditorialTableRow,
      EditorialTableHeader,
      EditorialTableCell,
      ImageExtension.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Start writing… Type / for commands" }),
      Markdown.configure({ markedOptions: { gfm: true } }),
    ],
    content: value,
    contentType: "markdown",
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown()),
    editorProps: {
      attributes: {
        class: "prose-paper min-h-[52vh] outline-none",
        spellcheck: "true",
      },
      handleClick: (view, position, event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.closest("a")) return false;

        const linkType = view.state.schema.marks.link;
        const range = linkType
          ? getMarkRange(view.state.doc.resolve(position), linkType)
          : undefined;
        if (!range) return false;

        view.dispatch(
          view.state.tr.setSelection(
            TextSelection.create(view.state.doc, range.from, range.to),
          ),
        );
        view.focus();
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.getMarkdown() === value) return;
    editor.commands.setContent(value, {
      contentType: "markdown",
      emitUpdate: false,
    });
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    const closeRequestedMenu = () => setLinkMenuRequested(false);
    editor.on("selectionUpdate", closeRequestedMenu);
    return () => {
      editor.off("selectionUpdate", closeRequestedMenu);
    };
  }, [editor]);

  if (!editor) return <div className="min-h-[52vh]" />;

  const openLinkMenu = () => {
    editor.chain().focus().extendMarkRange("link").run();
    setLinkMenuRequested(true);
    editor.view.dispatch(editor.state.tr.setMeta("editorial-link-menu", "open"));
  };

  const openNewMath = (kind: MathKind) => {
    setMathEditor({
      kind,
      latex: kind === "inline" ? DEFAULT_INLINE_MATH : DEFAULT_BLOCK_MATH,
    });
  };

  const saveMath = (latex: string) => {
    if (!mathEditor) return;
    const chain = editor.chain().focus();
    if (mathEditor.kind === "inline") {
      if (mathEditor.pos === undefined) chain.insertInlineMath({ latex });
      else chain.updateInlineMath({ latex, pos: mathEditor.pos });
    } else if (mathEditor.pos === undefined) {
      chain.insertBlockMath({ latex });
    } else {
      chain.updateBlockMath({ latex, pos: mathEditor.pos });
    }
    chain.run();
    setMathEditor(undefined);
  };

  const deleteMath = () => {
    if (!mathEditor || mathEditor.pos === undefined) return;
    const chain = editor.chain().focus();
    if (mathEditor.kind === "inline") {
      chain.deleteInlineMath({ pos: mathEditor.pos });
    } else {
      chain.deleteBlockMath({ pos: mathEditor.pos });
    }
    chain.run();
    setMathEditor(undefined);
  };

  const insertImage = (asset: MediaAsset) => {
    const src = mediaAssetUrl(asset, 1280);
    if (src) editor.chain().focus().setImage({ src, alt: asset.alt }).run();
  };

  const uploadInlineImage = async (file: File) => {
    setUploading(true);
    try {
      const asset = await uploadMediaAsset(file, "", () => undefined);
      insertImage(asset);
      toast.success("Image optimized and inserted");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const tool = (
    label: string,
    icon: React.ReactNode,
    active: boolean,
    action: () => void,
  ) => (
    <Toggle
      key={label}
      size="sm"
      pressed={active}
      onPressedChange={action}
      aria-label={label}
      title={label}
    >
      {icon}
    </Toggle>
  );

  return (
    <>
      <div
        role="toolbar"
        aria-label="Formatting tools"
        className="fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-paper-lift/92 p-1.5 shadow-lift-2 backdrop-blur"
      >
        {tool("Undo", <Undo2 />, false, () => editor.chain().focus().undo().run())}
        {tool("Redo", <Redo2 />, false, () => editor.chain().focus().redo().run())}
        <span className="mx-1 h-5 w-px bg-line" />
        {tool("Heading", <Heading2 />, editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        {tool("Bold", <Bold />, editor.isActive("bold"), () => editor.chain().focus().toggleBold().run())}
        {tool("Italic", <Italic />, editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run())}
        {tool("Bullet list", <List />, editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run())}
        {tool("Numbered list", <ListOrdered />, editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run())}
        {tool("Quote", <Quote />, editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run())}
        {tool("Code block", <Code2 />, editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run())}
        {tool(
          "Inline equation",
          <SquareFunction />,
          editor.isActive("inlineMath"),
          () => openNewMath("inline"),
        )}
        {tool(
          "Equation block",
          <SquareSigma />,
          editor.isActive("blockMath"),
          () => openNewMath("block"),
        )}
        {tool(
          "Table",
          <Table2 />,
          editor.isActive("table"),
          () =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
        )}
        {tool("Divider", <Minus />, false, () => editor.chain().focus().setHorizontalRule().run())}
        {tool("Link", <Link2 />, editor.isActive("link"), openLinkMenu)}
        {tool(uploading ? "Uploading image" : "Image", uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />, false, () => setMediaOpen(true))}
      </div>
      <div
        onPaste={(event) => {
          const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
          if (!file) return;
          event.preventDefault();
          void uploadInlineImage(file);
        }}
        onDragOver={(event) => {
          if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith("image/"))) event.preventDefault();
        }}
        onDrop={(event) => {
          const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/"));
          if (!file) return;
          event.preventDefault();
          void uploadInlineImage(file);
        }}
      >
        <EditorContent editor={editor} className="editorial-canvas" />
      </div>
      <SlashCommandMenu
        editor={editor}
        openMediaLibrary={() => setMediaOpen(true)}
        openMathEditor={setMathEditor}
      />
      <LinkBubbleMenu
        editor={editor}
        requested={linkMenuRequested}
        onRequestedChange={setLinkMenuRequested}
      />
      <TableBubbleMenu editor={editor} />
      <MediaLibraryDialog open={mediaOpen} onOpenChange={setMediaOpen} onSelect={insertImage} />
      <MathEditorDialog
        request={mathEditor}
        onOpenChange={(open) => {
          if (!open) setMathEditor(undefined);
        }}
        onSave={saveMath}
        onDelete={deleteMath}
      />
    </>
  );
}
