import React from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel,
}) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel || placeholder}
        className={cn(
          "h-12 w-full rounded-2xl border border-foreground/10 bg-background/55 pl-11 pr-4 shadow-none backdrop-blur-lg placeholder:text-muted-foreground",
          "focus:border-primary/30 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30",
          "text-foreground transition-all duration-200",
        )}
      />
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
        <SearchIcon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default SearchInput;
