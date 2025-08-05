import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  name: string;
  onExportPdf: () => void;
  isPdfLoading: boolean;
}

export const ResumeHeader: React.FC<HeaderProps> = ({
  name,
  onExportPdf,
  isPdfLoading,
}) => (
  <header className="flex justify-between items-center mb-8 sm:mb-12">
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
        {name}
      </h1>
      <h2 className="text-md md:text-lg text-cyan-600 dark:text-cyan-400">
        AI & Computer Science Student
      </h2>
    </motion.div>
    {/*<div className="flex items-center gap-2">*/}
    {/*  <motion.button*/}
    {/*    onClick={onExportPdf}*/}
    {/*    disabled={isPdfLoading}*/}
    {/*    className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"*/}
    {/*    aria-label="Download Resume as PDF"*/}
    {/*  >*/}
    {/*    {isPdfLoading ? (*/}
    {/*      <motion.div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></motion.div>*/}
    {/*    ) : (*/}
    {/*      <Download size={20} />*/}
    {/*    )}*/}
    {/*  </motion.button>*/}
    {/*</div>*/}
  </header>
);
