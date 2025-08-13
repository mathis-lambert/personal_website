'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Item = { value: string; label: string };

interface MultiSelectDropdownProps {
  label: string;
  items: Item[];
  selectedValues: string[];
  onChange: (next: string[]) => void;
  contentClassName?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  items,
  selectedValues,
  onChange,
  contentClassName,
}) => {
  const count = selectedValues.length;
  const triggerText = count > 0 ? `${label} (${count})` : label;

  const isSelected = (v: string) => selectedValues.includes(v);
  const toggleValue = (v: string, checked: boolean) => {
    if (checked) {
      if (!isSelected(v)) onChange([...selectedValues, v]);
    } else {
      if (isSelected(v)) onChange(selectedValues.filter((x) => x !== v));
    }
  };

  const clearAll = () => onChange([]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-full px-3 text-sm whitespace-nowrap"
        >
          {triggerText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={contentClassName ? contentClassName : 'w-56'}
      >
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="p-0 text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </DropdownMenuLabel>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearAll}
            >
              Clear
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.map((it) => (
          <DropdownMenuCheckboxItem
            key={it.value}
            checked={isSelected(it.value)}
            onCheckedChange={(checked) =>
              toggleValue(it.value, Boolean(checked))
            }
            onSelect={(e) => e.preventDefault()}
          >
            {it.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MultiSelectDropdown;
