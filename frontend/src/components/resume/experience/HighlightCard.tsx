import { Star, Calendar, MapPin } from 'lucide-react';
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
  <motion.article
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.5, ease: 'easeOut', delay }}
    className="mb-6 rounded-2xl border border-cyan-500/40 dark:border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-cyan-400/5 to-transparent backdrop-blur p-5 shadow-md hover:shadow-lg hover:border-cyan-500/60"
  >
    <div className="flex items-start gap-3">
      {experience.logo ? (
        <img
          src={experience.logo}
          alt={`${experience.company} logo`}
          loading="lazy"
          className="mt-0.5 h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-xl object-contain bg-white dark:bg-slate-900 ring-1 ring-cyan-500/40 dark:ring-cyan-400/30 p-1.5"
          onError={(e) => {
            // Fallback to star icon if image fails
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const sibling = e.currentTarget.nextElementSibling as HTMLSpanElement | null;
            if (sibling && sibling.dataset?.fallback === 'star') {
              sibling.style.display = 'inline-flex';
            }
          }}
        />
      ) : null}
      <span
        data-fallback="star"
        className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white shadow"
        style={{ display: experience.logo ? 'none' : 'inline-flex' }}
      >
        <Star size={16} />
      </span>
      <div className="flex-1">
        <h3 className="text-base md:text-lg font-semibold text-cyan-900 dark:text-cyan-100 leading-snug">
          {experience.role}
        </h3>
        <p className="text-sm md:text-[15px] font-medium text-cyan-700 dark:text-cyan-300">
          {experience.company}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-[13px] text-slate-600 dark:text-slate-400">
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
      </div>
    </div>

    <ul className="mt-3 pl-4 list-disc space-y-1.5 text-[13px] md:text-sm leading-relaxed text-slate-800 dark:text-slate-300 marker:text-cyan-500/80 dark:marker:text-cyan-400/80">
      {experience.description.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </motion.article>
);
