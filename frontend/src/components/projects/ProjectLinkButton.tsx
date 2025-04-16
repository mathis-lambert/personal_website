import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProjectLinkButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

const ProjectLinkButton: React.FC<ProjectLinkButtonProps> = ({
  href,
  icon,
  label,
  className,
}) => {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        `inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ease-out backdrop-blur-md shadow-md group`,
        `focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/10 dark:focus-visible:ring-offset-black/50`,
        `bg-gray-400/10 border-white/30 text-gray-800 hover:bg-white/30 hover:border-white/40 hover:shadow-lg hover:scale-[1.03]`, // Light mode
        `dark:bg-gray-800/30 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:hover:border-white/20 dark:hover:shadow-xl`, // Dark mode
        className,
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Visit ${label}`}
    >
      {icon}
      <span>{label}</span>
    </motion.a>
  );
};

export default ProjectLinkButton;
