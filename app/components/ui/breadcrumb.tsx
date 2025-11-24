import Link from 'next/link';
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('mb-6 md:mb-8 text-sm', className)}
    >
      <ol className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-400">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
