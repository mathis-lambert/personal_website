"use client";

import { ArrowDownUp } from "lucide-react";
import type React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/content/sort";

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  options?: ReadonlyArray<{ value: string; label: string }>;
}

const SortSelect: React.FC<SortSelectProps> = ({
  value,
  onChange,
  label = "Sort by",
  options = SORT_OPTIONS,
}) => (
  <Select value={String(value)} onValueChange={onChange}>
    <SelectTrigger aria-label={label} className="gap-2.5">
      <ArrowDownUp className="size-3.5 text-ink-faint" />
      <SelectValue placeholder={label} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={String(option.value)} value={String(option.value)}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default SortSelect;
