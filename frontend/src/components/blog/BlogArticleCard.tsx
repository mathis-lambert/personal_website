import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Article } from '@/types';
import { Star } from 'lucide-react';

interface BlogArticleCardProps {
  article: Article;
  animationDelay?: number;
}

const BlogArticleCard: React.FC<BlogArticleCardProps> = ({
  article,
  animationDelay = 0.1,
}) => {
  const formattedDate = new Date(article.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const imageSrc =
    article.media?.thumbnailUrl ||
    article.media?.imageUrl ||
    '/images/blog/article1.jpg';
  const readTime =
    typeof article.readTimeMin === 'number'
      ? `${article.readTimeMin} min read`
      : undefined;
  const isFeatured = Boolean(article.isFeatured);

  return (
    <motion.article
      className="group w-full h-full"
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: animationDelay, duration: 0.4, ease: 'easeOut' },
      }}
      exit={{ opacity: 0, y: 30 }}
    >
      <Link
        to={`/blog/${article.slug || article.id}`}
        className="block w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black/10 dark:focus-visible:ring-offset-black/30 rounded-3xl"
        aria-label={`Read article: ${article.title}`}
      >
        <div
          className={cn(
            `flex flex-col h-full rounded-3xl backdrop-blur-xl border border-white/40 relative shadow-md overflow-hidden`,
            `transition-all duration-300 ease-in-out group-hover:scale-[1.01] group-hover:shadow-xl`,
            `bg-white/30 dark:bg-gray-800/30 dark:text-gray-100 dark:border-white/10 dark:shadow-lg`,
          )}
        >
          {/* Cover image */}
          <div className="relative w-full h-44 sm:h-56 overflow-hidden">
            <img
              src={imageSrc}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            {isFeatured && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-400/90 text-black backdrop-blur-sm border border-black/10 shadow-sm">
                <Star className="w-3.5 h-3.5" /> Featured
              </span>
            )}
            {article.tags.length > 0 && (
              <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full bg-blue-500/80 text-white backdrop-blur-sm border border-white/10">
                {article.tags[0]}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 flex flex-col flex-grow">
            <header className="mb-2">
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                {article.title}
              </h3>
              <div className="mt-1 grid grid-cols-2 gap-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                <span className="truncate" title={formattedDate}>
                  {formattedDate}
                </span>
                {readTime && (
                  <span className="text-right truncate" title={readTime}>
                    {readTime}
                  </span>
                )}
                {article.author && (
                  <span
                    className="col-span-2 truncate"
                    title={`By ${article.author}`}
                  >
                    By {article.author}
                  </span>
                )}
              </div>
            </header>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 flex-grow line-clamp-3">
              {article.excerpt}
            </p>

            {article.tags && article.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {article.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-white/10 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <footer className="mt-auto pt-2 border-t border-white/20 dark:border-white/15 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center group-hover:underline">
                Read more
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
              {typeof article.metrics?.views === 'number' && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {article.metrics.views} views
                </span>
              )}
            </footer>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default BlogArticleCard;
