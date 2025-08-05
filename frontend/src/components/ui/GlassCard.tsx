import { motion } from 'framer-motion';
import React from 'react';

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
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut', delay }}
    className={`rounded-3xl backdrop-blur-2xl border border-black/10 dark:border-white/20 bg-white/50 dark:bg-gray-800/50 shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] ${className}`}
  >
    {children}
  </motion.div>
);
