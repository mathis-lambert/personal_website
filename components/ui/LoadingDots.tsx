import type React from "react";

import { cn } from "@/lib/utils";

/** Three ink dots. Used only while the assistant's first token is pending. */
const LoadingDots: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn("flex gap-1.5", className)}
    role="status"
    aria-label="Thinking"
  >
    <span className="size-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.3s]" />
    <span className="size-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.15s]" />
    <span className="size-1.5 animate-bounce rounded-full bg-ink-faint" />
  </div>
);

export default LoadingDots;
