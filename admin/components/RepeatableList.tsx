"use client";

import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Empty } from "@/admin/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * One labelled control, bound to a value.
 *
 * The CV editors used bare inputs with a placeholder standing in for a label,
 * so once you typed the box no longer said what it was. Every control here keeps
 * its label, and the whole set is laid out on one grid so the sections stop
 * looking like six different forms.
 */
export function Bound({
  label,
  value,
  onChange,
  type = "text",
  hint,
  placeholder,
  options,
  rows,
  className,
}: {
  label: string;
  value: string | boolean;
  onChange: (next: never) => void;
  type?: "text" | "textarea" | "date" | "switch" | "select" | "lines";
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  className?: string;
}) {
  const id = `f-${label.replace(/\W+/g, "-").toLowerCase()}-${String(value).slice(0, 6)}`;
  const set = onChange as (next: string | boolean) => void;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="t-eyebrow text-ink-faint">
        {label}
      </Label>
      {hint ? <p className="t-meta text-ink-faint">{hint}</p> : null}

      {type === "switch" ? (
        <Switch
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(next) => set(next)}
          className="mt-1"
        />
      ) : type === "select" ? (
        <Select value={String(value)} onValueChange={(next) => set(next)}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "textarea" || type === "lines" ? (
        <Textarea
          id={id}
          value={String(value)}
          rows={rows ?? 4}
          placeholder={placeholder}
          onChange={(event) => set(event.target.value)}
          className="resize-y"
        />
      ) : (
        <Input
          id={id}
          type={type === "date" ? "date" : "text"}
          value={String(value)}
          placeholder={placeholder}
          onChange={(event) => set(event.target.value)}
        />
      )}
    </div>
  );
}

/**
 * A list of records edited in place: add, remove, reorder, save the lot.
 *
 * Experience, education and certifications each had their own copy of this
 * scaffolding with a different button style and a different notion of where the
 * save button lived. One shape now, so the three read as the same tool.
 */
export function RepeatableList<T>({
  items,
  onChange,
  onSave,
  saving,
  addLabel,
  blank,
  summary,
  children,
  emptyTitle,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  onSave: () => void;
  saving: boolean;
  addLabel: string;
  blank: () => T;
  /** The one line that identifies a row when it is collapsed in your head. */
  summary: (item: T, index: number) => string;
  children: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  emptyTitle: string;
}) {
  const patchAt = (index: number) => (patch: Partial<T>) =>
    onChange(
      items.map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, blank()])}
        >
          <Plus /> {addLabel}
        </Button>
        <Button type="button" size="sm" onClick={onSave} disabled={saving}>
          <Save /> {saving ? "Saving…" : "Save section"}
        </Button>
      </div>

      {items.length === 0 ? (
        <Empty
          title={emptyTitle}
          hint="Nothing here yet. Add the first entry above."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="rounded-3 border border-line bg-paper-lift"
            >
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <GripVertical
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-ink-faint"
                />
                <span className="t-meta shrink-0 text-ink-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                  {summary(item, index) || "Untitled"}
                </span>
                <div className="flex shrink-0 items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <span aria-hidden="true">↑</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <span aria-hidden="true">↓</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${summary(item, index)}`}
                    onClick={() =>
                      onChange(items.filter((_, position) => position !== index))
                    }
                    className="text-ink-muted hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                {children(item, patchAt(index))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
