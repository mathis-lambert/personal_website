import React from "react";
import { cn } from "@/lib/utils";

interface TechnologyChipProps {
  technology: string;
  className?: string;
}

const TechnologyChip: React.FC<TechnologyChipProps> = ({
  technology,
  className,
}) => {
  // TODO: Add logic here to map technologies to specific icons or colors if desired
  return (
    <span
      className={cn(
        `inline-block text-sm px-3 py-1 rounded-full backdrop-blur-sm border shadow-sm`,
        `bg-white/40 border-white/30 text-gray-800`,
        `dark:bg-gray-700/40 dark:border-white/10 dark:text-gray-200`,
        `transition-colors duration-200 whitespace-nowrap`,
        className,
      )}
    >
      {technology}
    </span>
  );
};

export default TechnologyChip;
