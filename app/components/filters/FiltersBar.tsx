import React from "react";
import { X } from "lucide-react";
import SearchInput from "@/components/filters/SearchInput";
import SortSelect, { type SortOrder } from "@/components/filters/SortSelect";
import MultiSelectDropdown, {
  type MultiSelectItem,
} from "@/components/filters/MultiSelectDropdown";
import FeaturedToggle from "@/components/filters/FeaturedToggle";

export interface FiltersBarSection {
  type: "multiselect";
  label: string;
  items: MultiSelectItem[];
  selected: string[];
  onChange: (values: string[]) => void;
}

interface FiltersBarPropsBase {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOrder: SortOrder | string;
  onSortChange: (value: SortOrder | string) => void;
  filteredCount: number;
  onReset: () => void;
  sections?: FiltersBarSection[];
  showFeaturedToggle?: boolean;
  featuredOnly?: boolean;
  onFeaturedChange?: (value: boolean) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  sortOptions?: Array<{ value: SortOrder | string; label: string }>;
}

const FiltersBar: React.FC<FiltersBarPropsBase> = ({
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  filteredCount,
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
    (showFeaturedToggle && Boolean(featuredOnly)) ||
    sections.some((s) => s.selected.length > 0);

  const renderDropdowns = () => (
    <div className="flex items-center gap-2 overflow-x-auto flex-nowrap no-scrollbar">
      {sections.map((s) => (
        <MultiSelectDropdown
          key={s.label}
          label={s.label}
          items={s.items}
          selectedValues={s.selected}
          onChange={s.onChange}
        />
      ))}
    </div>
  );

  return (
    <div className="mb-8 flex flex-col gap-3">
      <div className="w-full">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          ariaLabel={searchAriaLabel}
        />
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-[9rem] flex-1 max-w-[14rem]">
            <SortSelect
              value={sortOrder}
              onChange={onSortChange}
              options={sortOptions}
            />
          </div>
          {showFeaturedToggle && onFeaturedChange && (
            <FeaturedToggle
              checked={featuredOnly}
              onChange={onFeaturedChange}
            />
          )}
        </div>
        {renderDropdowns()}
      </div>

      <div className="hidden sm:flex flex-wrap items-center gap-3">
        <div className="w-48">
          <SortSelect
            value={sortOrder}
            onChange={onSortChange}
            options={sortOptions}
          />
        </div>
        {showFeaturedToggle && onFeaturedChange && (
          <FeaturedToggle checked={featuredOnly} onChange={onFeaturedChange} />
        )}
        {renderDropdowns()}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200">
              Search: “{searchQuery}”
              <button
                className="p-0.5 hover:text-red-600"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {sections.map((s) =>
            s.selected.map((v) => (
              <span
                key={`${s.label}-${v}`}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200"
              >
                {s.label}: {v}
                <button
                  className="p-0.5 hover:text-red-600"
                  onClick={() => s.onChange(s.selected.filter((x) => x !== v))}
                  aria-label={`Clear ${s.label}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )),
          )}

          {showFeaturedToggle && featuredOnly && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200">
              Featured only
              {onFeaturedChange && (
                <button
                  className="p-0.5 hover:text-red-600"
                  onClick={() => onFeaturedChange(false)}
                  aria-label="Clear featured"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          )}

          <button
            className="ml-auto text-xs px-2 py-1 rounded-full border border-white/20 dark:border-white/10 bg-gray-400/10 hover:bg-white/30 dark:bg-gray-800/20 dark:hover:bg-gray-700/40 transition-colors"
            onClick={onReset}
          >
            Reset filters
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {filteredCount} result(s)
          </span>
        </div>
      )}
    </div>
  );
};

export default FiltersBar;
