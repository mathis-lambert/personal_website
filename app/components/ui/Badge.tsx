'use client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type ColorScheme = 'blue' | 'red' | 'yellow' | 'orange' | 'green';

interface BadgeProps {
  content: string;
  colorScheme: ColorScheme;
  className?: string;
  delay?: number; // Le délai en secondes pour démarrer l'animation
}

const colorVariants: Record<ColorScheme, { badge: string; dot: string }> = {
  blue: {
    badge:
      'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  red: {
    badge:
      'bg-red-100 text-red-800 border-red-400 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
    dot: 'bg-red-500 dark:bg-red-400',
  },
  yellow: {
    badge:
      'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
    dot: 'bg-yellow-500 dark:bg-yellow-400',
  },
  orange: {
    badge:
      'bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  green: {
    badge:
      'bg-green-100 text-green-800 border-green-400 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
    dot: 'bg-green-500 dark:bg-green-400',
  },
};

export function Badge({
  content,
  colorScheme,
  className,
  delay = 0,
}: BadgeProps) {
  const variants = colorVariants[colorScheme];

  return (
    <motion.span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants.badge,
        className,
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        delay: delay,
        ease: 'easeOut',
      }}
      exit={{
        opacity: 0,
        y: -10,
        transition: { duration: 0.3, ease: 'easeIn', delay: 0 },
      }}
      whileHover={{
        scale: 1.03,
        transition: { duration: 0.2, ease: 'easeInOut', delay: 0 },
      }}
    >
      <span className="relative flex h-2 w-2 mr-1.5">
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            variants.dot,
          )}
        ></span>
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            variants.dot,
          )}
        ></span>
      </span>
      {content}
    </motion.span>
  );
}
