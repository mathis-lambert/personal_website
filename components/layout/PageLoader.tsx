import { Loader2 } from "lucide-react";

import { Eyebrow } from "@/components/ds";
import { cn } from "@/lib/utils";

/** Full-page loading state. Plain paper. */
export function PageLoader({
  message = "Loading…",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[500] grid place-items-center bg-paper px-6",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-5 animate-spin text-brand" aria-hidden="true" />
        <Eyebrow>{message}</Eyebrow>
      </div>
    </div>
  );
}
