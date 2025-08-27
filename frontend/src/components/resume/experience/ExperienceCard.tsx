import { Calendar, MapPin } from 'lucide-react';
import type { Experience } from '@/types.ts';
import { motion } from 'framer-motion';

interface ExperienceCardProps {
  experience: Experience;
  delay?: number;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({
  experience,
  delay = 0,
}) => (
  <motion.article
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.45, ease: 'easeOut', delay }}
    className="mb-4 last:mb-0 rounded-2xl p-2 transition-colors"
  >
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50 leading-snug">
        {experience.role}
      </h3>
      {experience.current && (
        <span className="shrink-0 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] md:text-xs px-2 py-0.5 font-medium">
          Current
        </span>
      )}
    </div>

    <p className="mt-0.5 text-sm md:text-[15px] font-medium text-cyan-700 dark:text-cyan-300">
      {experience.company}
    </p>

    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-[13px] text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1">
        <Calendar size={14} className="opacity-70" />
        {experience.period}
      </span>
      <span className="hidden sm:inline">•</span>
      <span className="inline-flex items-center gap-1">
        <MapPin size={14} className="opacity-70" />
        {experience.location}
      </span>
    </div>

    <ul className="mt-3 space-y-1.5 text-[13px] md:text-sm leading-relaxed text-slate-700 dark:text-slate-300 pl-4 list-disc marker:text-cyan-500/70 dark:marker:text-cyan-400/70">
      {experience.description.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </motion.article>
);
