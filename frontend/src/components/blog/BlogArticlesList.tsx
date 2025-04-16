import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BlogArticleCard from './BlogArticleCard';
import { cn } from '@/lib/utils';
import { SearchIcon } from 'lucide-react';

// --- Interfaces ---
interface Article {
  id: number | string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string; // Should be in a format parsable by new Date() e.g., 'YYYY-MM-DD'
  readTime: string;
  tags: string[];
}

// --- Mock Data ---
// const mockArticles: Article[] = [];
const mockArticles: Article[] = [
  {
    id: 1,
    title: 'The Future of AI in Everyday Life',
    excerpt:
      'Discover how artificial intelligence is transforming daily tasks...',
    imageUrl: '/images/blog/article1.jpg',
    date: '2025-04-15',
    readTime: '5 min read',
    tags: ['AI', 'Technology', 'Future'],
  },
  {
    id: 2,
    title: 'Design Trends 2025: Minimalism and Beyond',
    excerpt: 'A look into the emerging design trends...',
    imageUrl: '/images/blog/article2.jpeg',
    date: '2025-03-22',
    readTime: '7 min read',
    tags: ['Design', 'Trends', 'Minimalism', 'UI/UX'],
  },
  {
    id: 3,
    title: 'How to Build Modern Web Applications',
    excerpt: 'Explore the best practices and modern technologies...',
    imageUrl: '/images/blog/article3.avif',
    date: '2025-02-10',
    readTime: '6 min read',
    tags: ['Web Development', 'Technology', 'React', 'JavaScript'],
  },
  {
    id: 4,
    title: 'Introduction to Quantum Computing',
    excerpt: 'A beginner-friendly overview of quantum computing principles...',
    imageUrl: '/images/blog/article4.webp',
    date: '2025-04-20',
    readTime: '8 min read',
    tags: ['Quantum Computing', 'Technology', 'Future', 'Science'],
  },
  {
    id: 5,
    title: 'Mastering CSS Grid Layout',
    excerpt:
      'Deep dive into CSS Grid, unlocking powerful layout capabilities...',
    imageUrl: '/images/blog/article5.jpg',
    date: '2025-04-01',
    readTime: '6 min read',
    tags: ['Web Development', 'CSS', 'Design', 'Frontend'],
  },
];

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Type for Sort Order ---
type SortOrder = 'newest' | 'oldest';

// --- Main Component ---
const BlogArticlesList: React.FC = () => {
  const [articles] = useState<Article[]>(mockArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest'); // Default sort order

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    articles.forEach((article) => {
      article.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const filteredAndSortedArticles = useMemo(() => {
    const tempArticles = articles.filter((article) => {
      if (selectedTag && !article.tags.includes(selectedTag)) {
        return false;
      }
      if (debouncedSearchQuery) {
        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        const isInTitle = article.title.toLowerCase().includes(lowerCaseQuery);
        const isInExcerpt = article.excerpt
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInTags = article.tags.some((tag) =>
          tag.toLowerCase().includes(lowerCaseQuery),
        );
        if (!isInTitle && !isInExcerpt && !isInTags) {
          return false;
        }
      }
      return true;
    });

    // Sort the filtered articles
    const sortedArticles = [...tempArticles];
    if (sortOrder === 'newest') {
      sortedArticles.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else if (sortOrder === 'oldest') {
      sortedArticles.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }

    return sortedArticles;
  }, [articles, selectedTag, debouncedSearchQuery, sortOrder]);

  const TagButton: React.FC<{
    tag: string | null;
    currentTag: string | null;
    onClick: () => void;
  }> = ({ tag, currentTag, onClick }) => (
    <motion.button
      onClick={onClick}
      className={cn(
        `px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ease-out backdrop-blur-sm whitespace-nowrap`,
        `focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/10 dark:focus-visible:ring-offset-black/50`,
        tag === currentTag
          ? 'bg-blue-500/70 border-blue-400/80 text-white shadow-md scale-105'
          : 'bg-gray-400/10 border-white/20 text-gray-700 hover:bg-white/30 hover:border-white/40 dark:bg-gray-800/20 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:border-white/20',
      )}
      whileHover={{ scale: tag === currentTag ? 1.05 : 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {tag === null ? 'All Topics' : tag}
    </motion.button>
  );

  return (
    <section className="w-full max-w-7xl mx-auto py-12 md:py-16 px-0 sm:px-6 lg:px-8 min-h-[60vh]">
      <motion.div
        className="mb-10 md:mb-12 flex flex-col gap-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Search Bar Row */}
        <div className="relative max-w-xl mx-auto w-full">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search articles"
            className={cn(
              `w-full pl-11 pr-4 py-3 rounded-full backdrop-blur-lg shadow-sm`,
              `bg-white/5 border border-white/20 placeholder-gray-500 dark:placeholder-gray-400`,
              `dark:bg-gray-800/20 dark:border-white/10`,
              `focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/0 focus:bg-white/10 dark:focus:bg-gray-800/30`,
              `transition-all duration-300 ease-in-out text-gray-800 dark:text-gray-100`,
            )}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <SearchIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Filters Row (Tags and Sort) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Scrollable Tags */}
          {allTags.length > 0 && (
            <div className="relative flex-grow min-w-0">
              <div className="flex items-center gap-2.5 overflow-x-auto p-1 no-scrollbar">
                <TagButton
                  tag={null}
                  currentTag={selectedTag}
                  onClick={() => setSelectedTag(null)}
                />

                {allTags.map((tag) => (
                  <TagButton
                    key={tag}
                    tag={tag}
                    currentTag={selectedTag}
                    onClick={() => setSelectedTag(tag)}
                  />
                ))}
                <div className="pr-2"></div>
              </div>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              aria-label="Sort articles by date"
              className={cn(
                `appearance-none pl-4 pr-10 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ease-out backdrop-blur-sm cursor-pointer`,
                `bg-gray-400/10 border-white/20 text-gray-700 hover:bg-white/30 hover:border-white/40`,
                `dark:bg-gray-800/20 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:border-white/20`,
                `focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent`,
                // Custom arrow styling using background image (Tailwind Forms plugin recommended for easier styling)
                `bg-no-repeat bg-right`,
                `bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]`, // Light mode arrow
                `dark:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]`, // Dark mode arrow (same color here, adjust if needed)
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
                Newest First
              </option>
              <option
                value="oldest"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                Oldest First
              </option>
            </select>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {filteredAndSortedArticles.length > 0 ? (
          <motion.div
            key={selectedTag + debouncedSearchQuery + sortOrder} // Add sortOrder to key for correct animation on sort change
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredAndSortedArticles.map((article, index) => (
              <BlogArticleCard
                key={article.id}
                article={article}
                animationDelay={index * 0.08}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 text-gray-500 dark:text-gray-400"
          >
            <p className="text-2xl mb-3 font-mono">( T _ T )</p>
            <p className="text-lg">No articles found.</p>
            <p className="mt-1 text-sm">
              Try a different search term, tag, or sort order.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default BlogArticlesList;
