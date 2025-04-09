import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '@/lib/utils.ts';

interface GlassCardProps {
  title?: string;
  size?: string; // 'small' | 'medium' | 'large'
  children: React.ReactNode;
  px?: number; // Padding X
  pt?: number; // Padding Top
}

const GlassCard: React.FC<GlassCardProps> = ({
  title,
  size = 'small',
  children,
  px = 3,
  pt = 15,
}) => {
  return (
    <motion.div
      className={`${size === 'small' ? 'col-span-1 row-span-1' : size === 'medium' ? 'col-span-2 row-span-1' : size === 'large' ? 'col-span-3 row-span-1' : ''}`}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
    >
      <div
        className={cn(
          `flex h-full rounded-3xl backdrop-blur-2xl border-1 border-white color relative shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:scale-102 dark:bg-gray-800/5 dark:text-white dark:border-white/20 px-${px} pt-${pt}`,
        )}
      >
        {title && (
          <div
            className={`z-10 absolute px-3 py-2 text-sm font-bold rounded-full shadow-lg bg-white backdrop-blur-2xl border-1 border-white color top-2 left-2 dark:bg-gray-700/60 dark:text-white dark:border-white/20`}
          >
            <span>{title}</span>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
