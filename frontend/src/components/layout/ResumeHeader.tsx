import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  name: string;
  actions?: React.ReactNode;
}

export const ResumeHeader: React.FC<HeaderProps> = ({ name, actions }) => (
  <header className="flex justify-between items-center mb-8 sm:mb-12">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
    >
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {name}
      </h1>
      <h2 className="text-md md:text-lg text-cyan-600 dark:text-cyan-400">
        AI & Computer Science Student
      </h2>
    </motion.div>

    {actions ? (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        className="ml-4"
      >
        {actions}
      </motion.div>
    ) : null}
  </header>
);
