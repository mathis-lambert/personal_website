"use client";

import { X } from "lucide-react";
import type React from "react";

import { Meta } from "@/components/ds";
import FeaturedToggle from "@/components/filters/FeaturedToggle";
import MultiSelectDropdown, {
  type MultiSelectItem,
} from "@/components/filters/MultiSelectDropdown";
import SearchInput from "@/components/filters/SearchInput";
import SortSelect from "@/components/filters/SortSelect";

interface FiltersBarSection {
  type: "multiselect";
  label: string;
  items: MultiSelectItem[];
  selected: string[];
  onChange: (values: string[]) => void;
}

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOrder: string;
  onSortChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
  sections?: FiltersBarSection[];
  showFeaturedToggle?: boolean;
  featuredOnly?: boolean;
  onFeaturedChange?: (value: boolean) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  sortOptions?: ReadonlyArray<{ value: string; label: string }>;
}

/** One removable filter pill. */
function Chip({
  children,
  onClear,
  clearLabel,
}: {
  children: React.ReactNode;
  onClear: () => void;
  clearLabel: string;
}) {
  return (
    <span className="tag pr-1.5">
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label={clearLabel}
        className="grid size-4 place-items-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-line hover:text-ink"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

/** Filter controls for the index pages. One row, wrapping at every breakpoint. */
const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  filteredCount,
  totalCount,
  onReset,
  sections = [],
  showFeaturedToggle = false,
  featuredOnly = false,
  onFeaturedChange,
  searchPlaceholder,
  searchAriaLabel,
  sortOptions,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    (showFeaturedToggle && featuredOnly) ||
    sections.some((section) => section.selected.length > 0);

  return (
    <div className="mb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-0 flex-1 sm:min-w-64">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            ariaLabel={searchAriaLabel}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <SortSelect
              value={sortOrder}
              onChange={onSortChange}
              options={sortOptions}
            />
          </div>

          {sections.map((section) => (
            <MultiSelectDropdown
              key={section.label}
              label={section.label}
              items={section.items}
              selectedValues={section.selected}
              onChange={section.onChange}
            />
          ))}

          {showFeaturedToggle && onFeaturedChange ? (
            <FeaturedToggle
              checked={featuredOnly}
              onChange={onFeaturedChange}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Meta className="mr-1">
          {hasActiveFilters
            ? `${filteredCount} of ${totalCount}`
            : `${totalCount} total`}
        </Meta>

        {searchQuery ? (
          <Chip onClear={() => onSearchChange("")} clearLabel="Clear search">
            “{searchQuery}”
          </Chip>
        ) : null}

        {sections.flatMap((section) =>
          section.selected.map((value) => (
            <Chip
              key={`${section.label}-${value}`}
              clearLabel={`Remove filter ${value}`}
              onClear={() =>
                section.onChange(
                  section.selected.filter((item) => item !== value),
                )
              }
            >
              {value}
            </Chip>
          )),
        )}

        {showFeaturedToggle && featuredOnly && onFeaturedChange ? (
          <Chip
            onClear={() => onFeaturedChange(false)}
            clearLabel="Clear featured filter"
          >
            Featured only
          </Chip>
        ) : null}

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="link-slide ml-auto text-[0.8125rem] font-bold"
          >
            Reset all
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default FiltersBar;
