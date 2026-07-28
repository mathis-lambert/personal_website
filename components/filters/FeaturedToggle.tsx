import type React from "react";

import { cn } from "@/lib/utils";

interface FeaturedToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}

/**
 * A switch in the shared control shell. The state reads through the brand
 * accent — the old version invented a yellow that existed nowhere else.
 */
const FeaturedToggle: React.FC<FeaturedToggleProps> = ({
  checked,
  onChange,
  label = "Featured only",
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "inline-flex h-11 select-none items-center gap-2.5 rounded-full border pl-2.5 pr-4 text-sm font-bold transition-colors duration-200 ease-(--ease-paper)",
      checked
        ? "border-brand-quiet bg-brand-wash text-brand"
        : "border-line bg-paper text-ink-muted hover:border-line-strong hover:text-ink",
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-(--ease-paper)",
        checked ? "bg-brand" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-4 rounded-full bg-paper-lift transition-transform duration-200 ease-(--ease-paper)",
          checked && "translate-x-4",
        )}
      />
    </span>
    {label}
  </button>
);

export default FeaturedToggle;
