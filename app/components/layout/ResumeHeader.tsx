'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  name: string;
  personal_statement: string;
  actions?: React.ReactNode;
}

export const ResumeHeader: React.FC<HeaderProps> = ({
  name,
  personal_statement,
  actions,
}) => (
  <header className="flex flex-col justify-center items-start gap-4 mb-4">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
    >
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
        {name}
      </h1>
      <h2 className="text-sm md:text-md text-cyan-600 dark:text-cyan-400">
        {personal_statement}
      </h2>
    </motion.div>

    {actions ? actions : null}
  </header>
);
