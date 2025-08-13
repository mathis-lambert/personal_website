import React from 'react';
import { cn } from '@/lib/utils';

export type SortOrder = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'featured';

interface SortSelectProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
  label?: string;
}

const SortSelect: React.FC<SortSelectProps> = ({
  value,
  onChange,
  label = 'Sort by',
}) => {
  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOrder)}
        aria-label={label}
        className={cn(
          'appearance-none pl-4 pr-10 h-9 rounded-full text-sm font-medium border transition-all duration-200 ease-out backdrop-blur-sm cursor-pointer w-full',
          'bg-gray-400/10 border-white/20 text-gray-700 hover:bg-white/30 hover:border-white/40',
          'dark:bg-gray-800/20 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:border-white/20',
          'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent',
          'bg-no-repeat bg-right',
          "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]",
          "dark:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]",
        )}
        style={{
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.25em 1.25em',
        }}
      >
        <option
          value="newest"
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          Newest first
        </option>
        <option
          value="oldest"
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          Oldest first
        </option>
        <option
          value="a-z"
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          A → Z
        </option>
        <option
          value="z-a"
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          Z → A
        </option>
        <option
          value="featured"
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          Featured first
        </option>
      </select>
    </div>
  );
};

export default SortSelect;
