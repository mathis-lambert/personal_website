"use client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type PageLoaderProps = {
  message?: string;
  className?: string;
};

export function PageLoader({
  message = "Loading your page...",
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[1200] flex items-center justify-center bg-background px-6 text-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_26%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.02),transparent_30%)]" />
      <motion.div
        className="relative flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 px-8 py-6 shadow-xl backdrop-blur-md"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </div>
          <div className="text-left">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Loading
            </p>
            <p className="text-sm font-semibold leading-snug text-foreground">
              {message}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-border/70">
            <motion.span
              className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/70"
              animate={{ x: ["-80%", "40%", "110%"] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Getting things ready...
          </p>
        </div>
      </motion.div>
    </div>
  );
}
