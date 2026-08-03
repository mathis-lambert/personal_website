"use client";

import type { Editor } from "@tiptap/react";
import { Command } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  filterSlashCommands,
  type SlashCommand,
} from "@/components/admin/editorial/slashCommands";
import type { MathEditorRequest } from "@/lib/editorial/math";

type MenuState = {
  query: string;
  range: { from: number; to: number };
  left: number;
  top: number;
};

export function SlashCommandMenu({
  editor,
  openMediaLibrary,
  openMathEditor,
}: {
  editor: Editor;
  openMediaLibrary: () => void;
  openMathEditor: (request: MathEditorRequest) => void;
}) {
  const [menu, setMenu] = useState<MenuState>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commands = useMemo(
    () => filterSlashCommands(menu?.query ?? ""),
    [menu?.query],
  );

  useEffect(() => {
    const update = () => {
      const { $from, from } = editor.state.selection;
      if (!$from.parent.isTextblock || $from.parent.type.name !== "paragraph") {
        setMenu(undefined);
        return;
      }

      const textBeforeCursor = $from.parent.textBetween(0, $from.parentOffset);
      const match = /^\/([^\s/]*)$/.exec(textBeforeCursor);
      if (!match) {
        setMenu(undefined);
        return;
      }

      const coords = editor.view.coordsAtPos(from);
      setMenu({
        query: match[1],
        range: { from: from - match[0].length, to: from },
        left: Math.max(12, Math.min(coords.left, window.innerWidth - 332)),
        top: Math.max(12, Math.min(coords.bottom + 8, window.innerHeight - 390)),
      });
      setSelectedIndex(0);
    };

    editor.on("transaction", update);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("transaction", update);
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  const run = useCallback(
    (command: SlashCommand) => {
      if (!menu) return;
      setMenu(undefined);
      command.run({ editor, range: menu.range, openMediaLibrary, openMathEditor });
    },
    [editor, menu, openMathEditor, openMediaLibrary],
  );

  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(undefined);
        return;
      }
      if (!commands.length) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setSelectedIndex(
          (current) => (current + direction + commands.length) % commands.length,
        );
      }
      if (event.key === "Enter") {
        event.preventDefault();
        run(commands[selectedIndex] ?? commands[0]);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [commands, menu, run, selectedIndex]);

  if (!menu) return null;

  return (
    <div
      className="fixed z-[600] w-80 overflow-hidden rounded-4 border border-line bg-paper-lift p-1.5 shadow-lift-2"
      style={{ left: menu.left, top: menu.top }}
      role="listbox"
      aria-label="Insert a block"
    >
      <div className="flex items-center gap-2 px-2.5 py-2 t-meta text-ink-faint">
        <Command className="size-3.5" />
        Insert a block
      </div>
      <div className="max-h-72 overflow-y-auto">
        {commands.length ? (
          commands.map((command, index) => {
            const Icon = command.icon;
            return (
              <button
                key={command.id}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => run(command)}
                onMouseEnter={() => setSelectedIndex(index)}
                className="flex w-full items-center gap-3 rounded-3 px-2.5 py-2 text-left aria-selected:bg-paper-sink"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-2 border border-line bg-paper text-ink-muted">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">
                    {command.label}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    {command.description}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <p className="px-3 py-5 text-xs text-ink-faint">No matching block.</p>
        )}
      </div>
    </div>
  );
}
