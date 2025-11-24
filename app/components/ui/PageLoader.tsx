'use client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type PageLoaderProps = {
  message?: string;
  className?: string;
};

export function PageLoader({
  message = 'Loading your page...',
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'relative isolate flex min-h-[75vh] items-center justify-center overflow-hidden bg-background px-6 py-16',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.span
          className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
          animate={{
            y: [0, -18, 0],
            scale: [1, 1.05, 1],
            rotate: [0, 8, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute bottom-4 right-2 h-56 w-56 rounded-full bg-accent/25 blur-3xl"
          animate={{ y: [0, 14, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.04),transparent_35%)]" />
      </motion.div>

      <motion.div
        className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-border/60 bg-card/80 p-10 text-center shadow-[0_40px_140px_-60px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/80 via-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
            <motion.span
              className="absolute inset-0 rounded-2xl border border-white/25"
              animate={{ opacity: [0.4, 0.15, 0.4] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </div>
          <div className="text-left">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Preparing experience
            </p>
            <p className="text-base font-semibold text-foreground">{message}</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 text-sm text-muted-foreground">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-border/60">
            <motion.span
              className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-primary/80 via-primary to-accent"
              animate={{ x: ['-50%', '120%'] }}
              transition={{
                duration: 1.7,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
          <p className="text-[13px] leading-tight text-foreground/80">
            We are warming up the visuals and fetching the content. Sit tight
            for a polished view.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
