'use client';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  delay = 0,
}) => (
  <motion.div
    className="group w-full"
    initial={{ opacity: 0, y: 30 }}
    animate={{
      opacity: 1,
      y: 0,
      transition: { delay: delay, duration: 0.4, ease: 'easeOut' },
    }}
    exit={{ opacity: 0, y: 30 }}
  >
    <div
      className={cn(
        'rounded-3xl backdrop-blur-2xl border border-black/10 dark:border-white/20 bg-white/50 dark:bg-gray-800/50 shadow-lg overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl',
        className,
      )}
    >
      {children}
    </div>
  </motion.div>
);
