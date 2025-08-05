import type { Experience } from '@/types.ts';
import { motion } from 'framer-motion';

interface ExperienceCardProps {
  experience: Experience;
  delay: number;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({
  experience,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut', delay }}
    className="mb-6 last:mb-0"
  >
    <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100">
      {experience.role}
    </h3>
    <p className="text-cyan-600 dark:text-cyan-400 font-medium">
      {experience.company}
    </p>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
      {experience.period} • {experience.location}
    </p>
    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 text-sm mt-2 pl-1">
      {experience.description.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </motion.div>
);
