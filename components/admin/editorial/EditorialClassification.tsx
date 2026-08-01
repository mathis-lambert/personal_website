"use client";

import {
  Archive,
  CircleDot,
  PackageCheck,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";

import type { EditorialDraft } from "@/lib/editorial/draft";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PROJECT_STAGES = [
  {
    value: "in-progress",
    label: "Building",
    icon: CircleDot,
  },
  {
    value: "completed",
    label: "Finished",
    icon: PackageCheck,
  },
  {
    value: "archived",
    label: "Archived",
    icon: Archive,
  },
] as const;

type TagFieldProps = {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  tone?: "ink" | "brand";
};

const normalizeTags = (values: string[]) => {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter((value) => {
      const key = value.toLocaleLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

function EditorialTagField({
  label,
  placeholder,
  values,
  onChange,
  tone = "ink",
}: TagFieldProps) {
  const [input, setInput] = useState("");

  const addValues = (raw: string) => {
    const additions = raw.split(/[,\n]/);
    const next = normalizeTags([...values, ...additions]);
    if (next.length !== values.length) onChange(next);
    setInput("");
  };

  const removeValue = (value: string) => {
    onChange(values.filter((candidate) => candidate !== value));
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>

      <div className="rounded-3 border border-line bg-paper p-2 transition-colors focus-within:border-brand/45 focus-within:ring-2 focus-within:ring-brand/10">
        {values.length ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {values.map((value) => (
              <Badge
                key={value}
                variant={tone === "ink" ? "default" : "outline"}
                className={cn(
                  "h-auto gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-medium normal-case tracking-normal",
                  tone === "ink"
                    ? "border-ink bg-ink text-paper"
                    : "border-brand/25 bg-brand/8 text-brand",
                )}
              >
                {value}
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  aria-label={`Remove ${value}`}
                  className="grid size-5 place-items-center rounded-full opacity-65 transition hover:bg-current/10 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-1.5">
          <Plus className="ml-1 size-3.5 shrink-0 text-ink-faint" />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onBlur={() => input.trim() && addValues(input)}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              if (!/[,\n]/.test(pasted)) return;
              event.preventDefault();
              addValues(`${input},${pasted}`);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                if (input.trim()) addValues(input);
              } else if (event.key === "Backspace" && !input && values.length) {
                removeValue(values.at(-1) ?? "");
              }
            }}
            placeholder={values.length ? "Add another…" : placeholder}
            aria-label={`Add ${label.toLocaleLowerCase()}`}
            className="h-8 min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}

function DetailField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ProjectStage({
  value,
  onChange,
}: {
  value: EditorialDraft["projectStatus"];
  onChange: (value: EditorialDraft["projectStatus"]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Project lifecycle</Label>
      <div
        role="radiogroup"
        aria-label="Project lifecycle"
        className="grid grid-cols-3 gap-1.5"
      >
        {PROJECT_STAGES.map((stage) => {
          const selected = value === stage.value;
          const Icon = stage.icon;

          return (
            <button
              key={stage.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(stage.value)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1.5 rounded-2 border px-1.5 py-2.5 text-center transition",
                selected
                  ? "border-brand/35 bg-brand/8 text-brand shadow-1"
                  : "border-line bg-paper hover:border-ink-faint hover:bg-paper-lift",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full",
                  selected ? "bg-brand text-white" : "bg-paper-sink text-ink-muted",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="truncate text-[0.6875rem] font-semibold text-ink">
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EditorialClassification({
  draft,
  onPatch,
}: {
  draft: EditorialDraft;
  onPatch: (patch: Partial<EditorialDraft>) => void;
}) {
  const isProject = draft.kind === "projects";

  return (
    <div className="space-y-4">
      <EditorialTagField
        label={isProject ? "Technology stack" : "Tags"}
        placeholder={isProject ? "Add technology…" : "Add tag…"}
        values={isProject ? draft.technologies : draft.tags}
        onChange={(values) =>
          onPatch(isProject ? { technologies: values } : { tags: values })
        }
      />

      <EditorialTagField
        label="Topics"
        placeholder="Add topic…"
        values={draft.categories}
        onChange={(categories) => onPatch({ categories })}
        tone="brand"
      />

      <div className="border-t border-line pt-4">
        {isProject ? (
          <div className="space-y-4">
            <ProjectStage
              value={draft.projectStatus}
              onChange={(projectStatus) => onPatch({ projectStatus })}
            />
            <DetailField
              label="My role"
              placeholder="Lead developer, product designer…"
              value={draft.role}
              onChange={(role) => onPatch({ role })}
            />
            <DetailField
              label="Client or context"
              placeholder="Personal project, Free Pro, open source…"
              value={draft.client}
              onChange={(client) => onPatch({ client })}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <DetailField
              label="Author"
              placeholder="Mathis Lambert"
              value={draft.author}
              onChange={(author) => onPatch({ author })}
            />
            <DetailField
              label="Original source"
              placeholder="Canonical URL (optional)"
              type="url"
              value={draft.canonicalUrl}
              onChange={(canonicalUrl) => onPatch({ canonicalUrl })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
