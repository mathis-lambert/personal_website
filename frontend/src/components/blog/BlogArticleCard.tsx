import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Article {
  id: number | string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  readTime: string;
  tags: string[];
}

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

  return (
    <motion.div
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
        to={`/blog/${article.id}`}
        className="block w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black/10 dark:focus-visible:ring-offset-black/30 rounded-3xl"
      >
        <div
          className={cn(
            `flex flex-col h-full rounded-3xl backdrop-blur-xl border border-white/40 relative shadow-md overflow-hidden`,
            `transition-all duration-300 ease-in-out group-hover:scale-[1.02] group-hover:shadow-xl`,
            `bg-white/30 dark:bg-gray-800/30 dark:text-gray-100 dark:border-white/10 dark:shadow-lg`,
          )}
        >
          <div className="relative w-full h-40 sm:h-48 overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
            {article.tags.length > 0 && (
              <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full bg-blue-500/70 text-white backdrop-blur-sm border border-white/10">
                {article.tags[0]}
              </span>
            )}
          </div>

          <div className="p-3 sm:p-4 flex flex-col flex-grow">
            <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
              {article.title}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex-grow hidden sm:block line-clamp-3">
              {article.excerpt}
            </p>
            <div className="flex-grow sm:hidden"></div>

            {article.tags && article.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-white/10 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/20 dark:border-white/15">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formattedDate}</span>
                <span>&middot;</span>
                <span>{article.readTime}</span>
              </div>

              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center group-hover:underline">
                <span className="hidden xs:inline mr-1">Read</span>
                <span className="hidden sm:inline mr-1">More</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default BlogArticleCard;
