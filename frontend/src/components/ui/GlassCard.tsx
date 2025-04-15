import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '@/lib/utils.ts';

interface GlassCardProps {
  title?: string;
  size?: string; // 'small' | 'medium' | 'large'
  children: React.ReactNode;
  px?: number; // Padding X (en rem)
  pt?: number; // Padding Top (en rem)
}

const GlassCard: React.FC<GlassCardProps> = ({
                                               title,
                                               size = 'small',
                                               children,
                                               px = 1,
                                               pt = 3.5
                                             }) => {

  // Styles dynamiques
  const dynamicStyles = {
    paddingLeft: px ? `${px}rem` : undefined,
    paddingRight: px ? `${px}rem` : undefined,
    paddingTop: pt ? `${pt}rem` : undefined,
  };

  return (
    <motion.div
      // ... props motion ...
      className={`${size === 'small' ? 'col-span-1 xs:row-span-1' : size === 'medium' ? 'col-span-1 xs:col-span-2 row-span-1' : size === 'large' ? 'col-span-1 xs:col-span-3 row-span-1' : ''}`}
    >
      <div
        className={cn(`flex h-full rounded-3xl backdrop-blur-2xl border-1 border-white color relative shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:scale-102 dark:bg-gray-800/5 dark:text-white dark:border-white/20`)}
        style={dynamicStyles}
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