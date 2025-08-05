import { SectionProps } from '@/types.ts';
import { motion } from 'framer-motion';

export const ResumeSection: React.FC<SectionProps> = ({
  icon: Icon,
  title,
  children,
  actions = null,
  delay = 0,
}) => (
  <div className="mb-8 last:mb-0">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center text-lg font-bold text-slate-700 dark:text-slate-200">
          <Icon className="mr-3 text-cyan-500" size={20} />
          {title}
        </h2>
        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>
    </motion.div>
    {children}
  </div>
);
