import { Search, X } from "lucide-react";
import type React from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search…",
  ariaLabel,
}) => (
  <div className="relative">
    <Search
      aria-hidden="true"
      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
    />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder}
      className="h-11 w-full rounded-full border border-line bg-paper pl-11 pr-10 text-sm text-ink outline-none transition-colors duration-200 ease-(--ease-paper) placeholder:text-ink-faint hover:border-line-strong focus:border-brand [&::-webkit-search-cancel-button]:hidden"
    />
    {value ? (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-paper-sink hover:text-ink"
      >
        <X className="size-3.5" />
      </button>
    ) : null}
  </div>
);

export default SearchInput;
