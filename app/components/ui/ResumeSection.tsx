import type { SectionProps } from '@/types.ts';

export const ResumeSection: React.FC<SectionProps> = ({
  icon: Icon,
  title,
  children,
  actions = null,
}) => (
  <div className="mb-8 last:mb-0">
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="relative flex items-center text-lg font-semibold text-slate-800 dark:text-slate-100">
          <Icon className="mr-3 text-cyan-500" size={20} />
          {title}
          <span className="absolute -bottom-1 left-8 h-0.5 w-16 bg-gradient-to-r from-cyan-500/80 to-transparent rounded" />
        </h2>
        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>
    </div>
    {children}
  </div>
);
