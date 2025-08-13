import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
}

const FeaturedToggle: React.FC<FeaturedToggleProps> = ({
  checked,
  onChange,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex items-center h-9 px-2 rounded-full border transition-colors select-none',
        checked
          ? 'bg-yellow-400/70 border-yellow-300/70'
          : 'bg-gray-400/30 border-white/20 dark:bg-gray-800/30 dark:border-white/10',
      )}
    >
      <span
        className={cn(
          'relative inline-flex items-center w-10 h-6 rounded-full transition-colors',
          checked ? 'bg-yellow-500/80' : 'bg-gray-500/40',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </span>
      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 inline-flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-400" /> Featured only
      </span>
    </button>
  );
};

export default FeaturedToggle;
