"use client";

import CodeBlock from "@tiptap/extension-code-block";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Braces, Code2, Play, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { codeLanguageOptions } from "@/lib/editorial/codeLanguages";
import { Button } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/content/MermaidDiagram";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function EditableCode() {
  return (
    <NodeViewContent
      className="block min-h-24 overflow-x-auto whitespace-pre p-5 font-mono text-sm leading-relaxed"
      spellCheck={false}
    />
  );
}

function EditorialCodeBlockView({
  editor,
  getPos,
  node,
  updateAttributes,
}: ReactNodeViewProps) {
  const language = String(node.attrs.language || "text");
  const languages = codeLanguageOptions(language);
  const isMermaid = language === "mermaid";
  const isJson = language === "json";
  const [mode, setMode] = useState<"code" | "preview">(
    node.textContent.trim() ? "preview" : "code",
  );

  const formatJson = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(node.textContent), null, 2);
      const position = getPos();
      if (typeof position !== "number") return;

      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.insertText(formatted, position + 1, position + node.nodeSize - 1);
          return true;
        })
        .run();
    } catch {
      toast.error("This JSON is not valid yet");
    }
  };

  return (
    <NodeViewWrapper className="my-7 overflow-hidden rounded-4 border border-line bg-paper-lift shadow-1">
      <div
        contentEditable={false}
        className="flex items-center gap-2 border-b border-line px-3 py-2.5"
      >
        {isMermaid ? (
          <Workflow className="size-4 text-brand" />
        ) : (
          <Code2 className="size-4 text-brand" />
        )}
        <Select
          items={languages}
          value={language}
          onValueChange={(nextLanguage) => {
            if (nextLanguage === null) return;
            updateAttributes({
              language: nextLanguage === "text" ? null : nextLanguage,
            });
          }}
        >
          <SelectTrigger
            size="sm"
            aria-label="Code language"
            className="h-8 w-auto min-w-32 border-0 bg-transparent px-2 font-mono text-xs hover:bg-paper-sink"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-44">
            {languages.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isJson || isMermaid ? (
          <div className="ml-auto flex items-center gap-1">
            {isJson ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={formatJson}
                disabled={!node.textContent.trim()}
                aria-label="Format JSON"
                title="Format JSON"
              >
                <Braces />
              </Button>
            ) : null}
            {isMermaid ? (
              <>
                <Button
                  type="button"
                  variant={mode === "code" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setMode("code")}
                  aria-label="Edit Mermaid source"
                  title="Edit source"
                >
                  <Code2 />
                </Button>
                <Button
                  type="button"
                  variant={mode === "preview" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setMode("preview")}
                  disabled={!node.textContent.trim()}
                  aria-label="Render Mermaid diagram"
                  title="Render diagram"
                >
                  <Play />
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {!isMermaid || mode === "code" ? (
        <div className="m-0 rounded-none bg-[#17191d] text-white">
          <EditableCode />
        </div>
      ) : (
        <div contentEditable={false} className="min-h-32 overflow-x-auto p-5">
          <MermaidDiagram source={node.textContent} className="prose-mermaid" />
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const EditorialCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EditorialCodeBlockView);
  },
}).configure({ enableTabIndentation: true });
