import React from 'react';
import FeaturedToggle from './FeaturedToggle';
import SortSelect, { type SortOrder } from './SortSelect';
import SearchInput from './SearchInput';
import MultiSelectDropdown from './MultiSelectDropdown';
import { X } from 'lucide-react';

interface FiltersBarProps {
  // search
  searchQuery: string;
  onSearchChange: (value: string) => void;
  // tech
  allTechnologies: string[];
  selectedTechnologies: string[];
  onSelectTechnologies: (values: string[]) => void;
  // categories
  allCategories: string[];
  selectedCategories: string[];
  onSelectCategories: (values: string[]) => void;
  // status (multi)
  selectedStatuses: string[];
  onSelectStatuses: (values: string[]) => void;
  // featured
  featuredOnly: boolean;
  onFeaturedChange: (value: boolean) => void;
  // sort
  sortOrder: SortOrder;
  onSortChange: (value: SortOrder) => void;
  // misc
  filteredCount: number;
  onReset: () => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  allTechnologies,
  selectedTechnologies,
  onSelectTechnologies,
  allCategories,
  selectedCategories,
  onSelectCategories,
  selectedStatuses,
  onSelectStatuses,
  featuredOnly,
  onFeaturedChange,
  sortOrder,
  onSortChange,
  filteredCount,
  onReset,
}) => {
  const statusItems = [
    { value: 'in-progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ];

  const renderDropdowns = () => (
    <div className="flex items-center gap-2 overflow-x-auto flex-nowrap no-scrollbar">
      {allTechnologies.length > 0 && (
        <MultiSelectDropdown
          label="Technologies"
          items={allTechnologies.map((t) => ({ value: t, label: t }))}
          selectedValues={selectedTechnologies}
          onChange={onSelectTechnologies}
        />
      )}
      {allCategories.length > 0 && (
        <MultiSelectDropdown
          label="Categories"
          items={allCategories.map((c) => ({ value: c, label: c }))}
          selectedValues={selectedCategories}
          onChange={onSelectCategories}
        />
      )}
      <MultiSelectDropdown
        label="Status"
        items={statusItems}
        selectedValues={selectedStatuses}
        onChange={onSelectStatuses}
      />
    </div>
  );
  return (
    <div className="mb-8 flex flex-col gap-3">
      <div className="w-full">
        <SearchInput value={searchQuery} onChange={onSearchChange} />
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-[9rem] flex-1 max-w-[14rem]">
            <SortSelect value={sortOrder} onChange={onSortChange} />
          </div>
          <FeaturedToggle checked={featuredOnly} onChange={onFeaturedChange} />
        </div>
        {renderDropdowns()}
      </div>

      {/* Desktop and up: all filters aligned on one row */}
      <div className="hidden sm:flex flex-wrap items-center gap-3">
        <div className="w-48">
          <SortSelect value={sortOrder} onChange={onSortChange} />
        </div>
        <FeaturedToggle checked={featuredOnly} onChange={onFeaturedChange} />
        {renderDropdowns()}
      </div>

      {/* Active filters and reset */}
      {(searchQuery ||
        selectedTechnologies.length ||
        selectedCategories.length ||
        selectedStatuses.length ||
        featuredOnly) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200">
              Search: “{searchQuery}”
              <button
                className="p-0.5 hover:text-red-600"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {selectedTechnologies.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200"
            >
              Tech: {t}
              <button
                className="p-0.5 hover:text-red-600"
                onClick={() =>
                  onSelectTechnologies(
                    selectedTechnologies.filter((x) => x !== t),
                  )
                }
                aria-label="Clear technology"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {selectedCategories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200"
            >
              Category: {c}
              <button
                className="p-0.5 hover:text-red-600"
                onClick={() =>
                  onSelectCategories(selectedCategories.filter((x) => x !== c))
                }
                aria-label="Clear category"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {selectedStatuses.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200"
            >
              Status: {s}
              <button
                className="p-0.5 hover:text-red-600"
                onClick={() =>
                  onSelectStatuses(selectedStatuses.filter((x) => x !== s))
                }
                aria-label="Clear status"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {featuredOnly && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-200">
              Featured only
              <button
                className="p-0.5 hover:text-red-600"
                onClick={() => onFeaturedChange(false)}
                aria-label="Clear featured"
              >
                <X className="w-3.5 h-3.5" />
              </button>
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
