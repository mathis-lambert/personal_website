"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Columns3,
  PanelTop,
  Rows3,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type TableAction = {
  label: string;
  icon: React.ReactNode;
  run: () => void;
  enabled: boolean;
  destructive?: boolean;
};

export function TableBubbleMenu({ editor }: { editor: Editor }) {
  const actions: TableAction[] = [
    {
      label: "Add row above",
      icon: <BetweenHorizontalStart />,
      run: () => editor.chain().focus().addRowBefore().run(),
      enabled: editor.can().addRowBefore(),
    },
    {
      label: "Add row below",
      icon: <BetweenHorizontalEnd />,
      run: () => editor.chain().focus().addRowAfter().run(),
      enabled: editor.can().addRowAfter(),
    },
    {
      label: "Delete row",
      icon: <Rows3 />,
      run: () => editor.chain().focus().deleteRow().run(),
      enabled: editor.can().deleteRow(),
      destructive: true,
    },
    {
      label: "Add column left",
      icon: <BetweenVerticalStart />,
      run: () => editor.chain().focus().addColumnBefore().run(),
      enabled: editor.can().addColumnBefore(),
    },
    {
      label: "Add column right",
      icon: <BetweenVerticalEnd />,
      run: () => editor.chain().focus().addColumnAfter().run(),
      enabled: editor.can().addColumnAfter(),
    },
    {
      label: "Delete column",
      icon: <Columns3 />,
      run: () => editor.chain().focus().deleteColumn().run(),
      enabled: editor.can().deleteColumn(),
      destructive: true,
    },
    {
      label: "Toggle header row",
      icon: <PanelTop />,
      run: () => editor.chain().focus().toggleHeaderRow().run(),
      enabled: editor.can().toggleHeaderRow(),
    },
    {
      label: "Delete table",
      icon: <Trash2 />,
      run: () => editor.chain().focus().deleteTable().run(),
      enabled: editor.can().deleteTable(),
      destructive: true,
    },
  ];

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="editorial-table-menu"
      shouldShow={({ editor: current }) => current.isActive("table")}
      options={{ placement: "top", offset: 10, flip: true, shift: true }}
      className="max-w-[calc(100vw-1.5rem)]"
    >
      <div
        role="toolbar"
        aria-label="Table tools"
        className="flex items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-paper-lift/95 p-1.5 shadow-lift-2 backdrop-blur"
      >
        {actions.map((action, index) => (
          <div key={action.label} className="contents">
            {index === 3 || index === 6 || index === 7 ? (
              <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!action.enabled}
              aria-label={action.label}
              title={action.label}
              className={action.destructive ? "hover:text-brand" : undefined}
              onClick={action.run}
            >
              {action.icon}
            </Button>
          </div>
        ))}
      </div>
    </BubbleMenu>
  );
}
