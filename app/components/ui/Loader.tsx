"use client";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

type TextSize = "text-sm" | "text-base" | "text-lg" | "text-xl";

interface LoaderProps {
  message?: string;
  /**
   * Tailwind size scale (8 => roughly 32px). Converted to px at runtime to
   * avoid relying on dynamic class names.
   */
  spinnerSize?: number;
  textSize?: TextSize;
}

const TEXT_SIZES: Record<TextSize, string> = {
  "text-sm": "text-sm",
  "text-base": "text-base",
  "text-lg": "text-lg",
  "text-xl": "text-xl",
};

function Loader({
  message = "Chargement...",
  spinnerSize = 8,
  textSize = "text-base",
}: LoaderProps) {
  const spinnerPixels = Math.max(4, spinnerSize) * 4;
  const resolvedTextSize = TEXT_SIZES[textSize] ?? TEXT_SIZES["text-base"];

  const overlay = useMemo(
    () => (
      <div
        className="fixed inset-0 z-[5000] flex min-h-screen w-screen items-center justify-center bg-background text-foreground"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, hsla(var(--foreground),0.06), transparent 28%), radial-gradient(circle at 80% 10%, hsla(var(--foreground),0.05), transparent 24%), hsla(var(--background),0.9)",
          backdropFilter: "blur(12px)",
        }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          <Loader2
            className="animate-spin text-primary drop-shadow-md"
            style={{ width: spinnerPixels, height: spinnerPixels }}
            aria-hidden="true"
          />
          <p
            className={`text-muted-foreground animate-pulse ${resolvedTextSize}`}
          >
            {message}
          </p>
        </div>
      </div>
    ),
    [message, resolvedTextSize, spinnerPixels],
  );

  return overlay;
}

export default Loader;
