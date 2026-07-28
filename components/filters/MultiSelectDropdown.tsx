"use client";

import { ChevronDown } from "lucide-react";
import type React from "react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type MultiSelectItem = { value: string; label: string };

interface MultiSelectDropdownProps {
  label: string;
  items: MultiSelectItem[];
  selectedValues: string[];
  onChange: (next: string[]) => void;
}

/**
 * Multi-select in the shared control shell. Uses the same height, radius and
 * border as the search field and the sort select, so the filter row reads as
 * one instrument instead of three.
 */
const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  items,
  selectedValues,
  onChange,
}) => {
  const count = selectedValues.length;
  const active = count > 0;

  const toggle = (value: string, checked: boolean) =>
    onChange(
      checked
        ? [...selectedValues.filter((item) => item !== value), value]
        : selectedValues.filter((item) => item !== value),
    );

  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-bold outline-none transition-colors duration-200 ease-(--ease-paper)",
          active
            ? "border-brand-quiet bg-brand-wash text-brand"
            : "border-line bg-paper text-ink-muted hover:border-line-strong hover:text-ink",
        )}
      >
        {label}
        {active ? (
          <span className="grid size-5 place-items-center rounded-full bg-brand text-[0.6875rem] text-brand-ink">
            {count}
          </span>
        ) : null}
        <ChevronDown className="size-4 opacity-60" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-80 w-60 overflow-y-auto">
        {active ? (
          <>
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full px-2 py-1.5 text-left text-[0.8125rem] font-bold text-brand"
            >
              Clear {label.toLowerCase()}
            </button>
            <DropdownMenuSeparator />
          </>
        ) : null}

        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.value}
            checked={selectedValues.includes(item.value)}
            onCheckedChange={(checked) => toggle(item.value, Boolean(checked))}
            onSelect={(event) => event.preventDefault()}
          >
            {item.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MultiSelectDropdown;
