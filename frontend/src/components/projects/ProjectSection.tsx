import React from 'react';
import { cn } from '@/lib/utils';

interface ProjectSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  title,
  children,
  className,
  titleClassName,
  contentClassName,
}) => {
  return (
    <section className={cn('py-5', className)}>
      <h3
        className={cn(
          'text-xl font-semibold mb-3 pb-2 border-b border-white/20 dark:border-white/15 text-gray-800 dark:text-gray-100',
          titleClassName,
        )}
      >
        {title}
      </h3>
      <div
        className={cn(
          'text-gray-700 dark:text-gray-300 leading-relaxed',
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
};

export default ProjectSection;
