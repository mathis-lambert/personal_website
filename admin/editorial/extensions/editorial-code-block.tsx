"use client";

import CodeBlock from "@tiptap/extension-code-block";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Code2, Play, Workflow } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";

function EditableCode() {
  return (
    <NodeViewContent
      className="block min-h-24 overflow-x-auto whitespace-pre p-5 font-mono text-sm leading-relaxed"
      spellCheck={false}
    />
  );
}

function EditorialCodeBlockView({ node }: ReactNodeViewProps) {
  const isMermaid = node.attrs.language === "mermaid";
  const [mode, setMode] = useState<"code" | "preview">(
    node.textContent.trim() ? "preview" : "code",
  );

  if (!isMermaid) {
    return (
      <NodeViewWrapper className="overflow-hidden rounded-4 bg-[#221c17] text-white">
        <EditableCode />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-7 overflow-hidden rounded-4 border border-line bg-paper-lift shadow-1">
      <div
        contentEditable={false}
        className="flex items-center gap-2 border-b border-line px-3 py-2.5"
      >
        <Workflow className="size-4 text-brand" />
        <span className="text-sm font-bold text-ink">Mermaid</span>
        <div className="ml-auto flex items-center gap-1">
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
        </div>
      </div>

      {mode === "code" ? (
        <div className="m-0 rounded-none bg-[#221c17] text-white">
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
