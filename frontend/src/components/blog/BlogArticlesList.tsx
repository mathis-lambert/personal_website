import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BlogArticleCard from './BlogArticleCard';
import FiltersBar from '@/components/filters/FiltersBar';
import type { Article } from '@/types';
import { getArticles } from '@/api/articles';

// --- Data ---

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
type SortOrder = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'featured';

// --- Main Component ---
const BlogArticlesList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch articles from API
  useEffect(() => {
    const ac = new AbortController();
    async function fetchArticles() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getArticles({ signal: ac.signal });
        setArticles(data);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('Failed to fetch articles:', e);
        setError('Failed to load articles.');
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticles();
    return () => ac.abort();
  }, []);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    articles.forEach((article) => {
      article.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const filteredAndSortedArticles = useMemo(() => {
    const tempArticles = articles.filter((article) => {
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((t) => article.tags.includes(t))
      )
        return false;
      if (featuredOnly && !article.isFeatured) return false;
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
    } else if (sortOrder === 'a-z') {
      sortedArticles.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'z-a') {
      sortedArticles.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOrder === 'featured') {
      sortedArticles.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    return sortedArticles;
  }, [articles, selectedTags, featuredOnly, debouncedSearchQuery, sortOrder]);

  return (
    <section className="w-full max-w-7xl mx-auto py-12 md:py-16 px-0 sm:px-6 lg:px-8 min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onSortChange={(v) => setSortOrder(v as SortOrder)}
          filteredCount={filteredAndSortedArticles.length}
          onReset={() => {
            setSearchQuery('');
            setSelectedTags([]);
            setFeaturedOnly(false);
            setSortOrder('newest');
          }}
          sections={[
            {
              type: 'multiselect',
              label: 'Tags',
              items: allTags.map((t) => ({ value: t, label: t })),
              selected: selectedTags,
              onChange: setSelectedTags,
            },
          ]}
          showFeaturedToggle
          featuredOnly={featuredOnly}
          onFeaturedChange={setFeaturedOnly}
          searchPlaceholder="Search articles..."
          searchAriaLabel="Search articles"
          sortOptions={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'a-z', label: 'A → Z' },
            { value: 'z-a', label: 'Z → A' },
            { value: 'featured', label: 'Featured first' },
          ]}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading-articles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-3xl h-60 animate-pulse bg-white/20 dark:bg-gray-800/30 border border-white/20 dark:border-white/10"
              />
            ))}
          </motion.div>
        ) : filteredAndSortedArticles.length > 0 ? (
          <motion.div
            key={[selectedTags.join(','), debouncedSearchQuery, sortOrder].join(
              '|',
            )}
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
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default BlogArticlesList;
