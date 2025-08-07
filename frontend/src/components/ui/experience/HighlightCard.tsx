import { Star } from 'lucide-react';
import type { Experience } from '@/types.ts';
import { motion } from 'framer-motion';

interface HighlightCardProps {
  experience: Experience;
  delay?: number;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  experience,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.55, ease: 'easeOut', delay }}
    className="mb-6 relative p-5 rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-400/10 via-cyan-400/5 to-transparent shadow-2xl shadow-cyan-500/10"
  >
    <div className="absolute -top-3 -left-3 bg-cyan-500 text-white p-2 rounded-full shadow-lg">
      <Star size={20} />
    </div>
    <h3 className="text-lg font-bold text-cyan-800 dark:text-cyan-300">
      {experience.role}
    </h3>
    <p className="text-slate-600 dark:text-slate-300 font-medium">
      {experience.company}
    </p>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
      {experience.period} • {experience.location}
    </p>
    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 text-sm">
      {experience.description.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </motion.div>
);
