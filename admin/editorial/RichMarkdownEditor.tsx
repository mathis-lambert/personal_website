"use client";

import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
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
  Undo2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { uploadMediaAsset } from "@/api/media";
import { EditorialCodeBlock } from "@/admin/editorial/extensions/editorial-code-block";
import { MediaLibraryDialog } from "@/admin/editorial/MediaLibraryDialog";
import { SlashCommandMenu } from "@/admin/editorial/SlashCommandMenu";
import { Toggle } from "@/components/ui/toggle";
import { mediaAssetUrl, type MediaAsset } from "@/types/media";

export function RichMarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: { openOnClick: false },
      }),
      EditorialCodeBlock,
      ImageExtension.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Start writing… Type / for commands" }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown()),
    editorProps: {
      attributes: {
        class: "prose-paper min-h-[52vh] outline-none",
        spellcheck: "true",
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

  if (!editor) return <div className="min-h-[52vh]" />;

  const addLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", previous ?? "https://");
    if (href === null) return;
    if (!href.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
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
        {tool("Divider", <Minus />, false, () => editor.chain().focus().setHorizontalRule().run())}
        {tool("Link", <Link2 />, editor.isActive("link"), addLink)}
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
      <SlashCommandMenu editor={editor} openMediaLibrary={() => setMediaOpen(true)} />
      <MediaLibraryDialog open={mediaOpen} onOpenChange={setMediaOpen} onSelect={insertImage} />
    </>
  );
}
