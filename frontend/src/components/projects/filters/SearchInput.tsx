import React from 'react';
import { SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search by title, description, technology, client..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search projects"
        className={cn(
          'w-full pl-11 pr-4 h-11 rounded-full backdrop-blur-lg shadow-sm',
          'bg-white/5 border border-white/20 placeholder-gray-500 dark:placeholder-gray-400',
          'dark:bg-gray-800/20 dark:border-white/10',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/0 focus:bg-white/10 dark:focus:bg-gray-800/30',
          'transition-all duration-300 ease-in-out text-gray-800 dark:text-gray-100',
        )}
      />
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
        <SearchIcon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default SearchInput;
