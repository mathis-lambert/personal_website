"use client";

import type { ReactNode } from "react";

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
 * A form field, described rather than hand-built.
 *
 * The old editors were bare inputs with a `placeholder` standing in for a label,
 * which disappears the moment you type and leaves you guessing what a box is
 * for. Every field here has a real label, an optional hint that stays visible,
 * and one consistent way of being laid out.
 */
export type FieldSpec = {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "markdown"
    | "date"
    | "url"
    | "number"
    | "list"
    | "switch"
    | "select";
  /** Shown under the label, always. Say what good input looks like. */
  hint?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Fields sharing a section title are grouped under it in the editor. */
  section?: string;
  /** Half-width on wide editors, for short values that pair naturally. */
  half?: boolean;
};

export function Field({
  spec,
  defaultValue,
  children,
}: {
  spec: FieldSpec;
  defaultValue?: unknown;
  children?: ReactNode;
}) {
  const id = `field-${spec.name}`;
  const described = spec.hint ? `${id}-hint` : undefined;

  const value =
    defaultValue == null
      ? ""
      : Array.isArray(defaultValue)
        ? defaultValue.join(", ")
        : String(defaultValue);

  return (
    <div className={cn("flex flex-col gap-1.5", spec.half && "sm:col-span-1")}>
      <Label htmlFor={id} className="t-eyebrow text-ink">
        {spec.label}
        {spec.required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      {spec.hint ? (
        <p id={described} className="t-meta text-ink-faint">
          {spec.hint}
        </p>
      ) : null}

      {children ??
        (spec.type === "switch" ? (
          <Switch
            id={id}
            name={spec.name}
            defaultChecked={Boolean(defaultValue)}
            aria-describedby={described}
          />
        ) : spec.type === "select" ? (
          <Select name={spec.name} defaultValue={value || undefined}>
            <SelectTrigger id={id} aria-describedby={described}>
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent>
              {spec.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : spec.type === "textarea" || spec.type === "markdown" ? (
          <Textarea
            id={id}
            name={spec.name}
            defaultValue={value}
            required={spec.required}
            placeholder={spec.placeholder}
            aria-describedby={described}
            className={cn(
              "resize-y",
              spec.type === "markdown" && "min-h-72 font-mono text-[0.8rem]",
            )}
          />
        ) : (
          <Input
            id={id}
            name={spec.name}
            type={
              spec.type === "date"
                ? "date"
                : spec.type === "number"
                  ? "number"
                  : spec.type === "url"
                    ? "url"
                    : "text"
            }
            defaultValue={value}
            required={spec.required}
            placeholder={spec.placeholder}
            aria-describedby={described}
          />
        ))}
    </div>
  );
}

/** Fields in declaration order, split into the sections they declared. */
export function FieldSections({
  fields,
  values,
}: {
  fields: FieldSpec[];
  values?: Record<string, unknown> | null;
}) {
  const sections: { title: string; fields: FieldSpec[] }[] = [];
  for (const spec of fields) {
    const title = spec.section ?? "Details";
    const last = sections.at(-1);
    if (last?.title === title) last.fields.push(spec);
    else sections.push({ title, fields: [spec] });
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <fieldset key={section.title} className="min-w-0">
          <legend className="t-eyebrow mb-3.5 w-full border-b border-line pb-2 text-ink-faint">
            {section.title}
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            {section.fields.map((spec) => (
              <div
                key={spec.name}
                className={cn(!spec.half && "sm:col-span-2")}
              >
                <Field spec={spec} defaultValue={values?.[spec.name]} />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
