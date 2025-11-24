'use client';

import { motion } from 'framer-motion';

import Resume from '@/components/ui/Resume';
import type { ResumeData } from '@/types';

export function ResumePageContent({ resume }: { resume: ResumeData | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
    >
      <Resume resumeData={resume} />
    </motion.div>
  );
}
