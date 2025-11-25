import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}

const FeaturedToggle: React.FC<FeaturedToggleProps> = ({
  checked,
  onChange,
  label = "Featured only",
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center h-9 px-2 rounded-full border transition-colors select-none",
        checked
          ? "bg-yellow-200/30 border-yellow-300/30 hover:bg-yellow-200/50 hover:border-yellow-300/80"
          : "bg-gray-400/10  border-white/30 dark:border-white/10 dark:bg-gray-800/30 hover:bg-white/30 hover:border-white/40 dark:hover:bg-gray-700/40",
      )}
    >
      <span
        className={cn(
          "relative inline-flex items-center w-10 h-6 rounded-full transition-colors",
          checked ? "bg-yellow-500/80" : "bg-gray-500/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 inline-flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-400" /> {label}
      </span>
    </button>
  );
};

export default FeaturedToggle;
