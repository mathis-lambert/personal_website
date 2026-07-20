"use client";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Article } from "@/types";
import { Star } from "lucide-react";
import Image from "next/image";
import { trackUiEvent } from "@/api/analytics";

interface BlogArticleCardProps {
  article: Article;
  animationDelay?: number;
}

const BlogArticleCard: React.FC<BlogArticleCardProps> = ({
  article,
  animationDelay = 0.1,
}) => {
  const formattedDate = new Date(article.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const imageSrc = article.media?.thumbnailUrl || article.media?.imageUrl;
  const readTime =
    typeof article.readTimeMin === "number"
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
        transition: { delay: animationDelay, duration: 0.4, ease: "easeOut" },
      }}
      exit={{ opacity: 0, y: 30 }}
    >
      <Link
        href={`/blog/${article.slug || article._id}`}
        onClick={() => {
          void trackUiEvent({
            name: "article_open",
            path: `/blog/${article.slug || article._id}`,
            properties: {
              slug: article.slug ?? article._id,
              title: article.title,
            },
          });
        }}
        className="block h-full w-full rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Read article: ${article.title}`}
      >
        <div
          className={cn(
            "paper-surface relative flex h-full flex-col overflow-hidden rounded-[2rem]",
            "transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-2xl",
          )}
        >
          {/* Cover image */}
          <div className="relative h-48 w-full overflow-hidden sm:h-56">
            <Image
              src={imageSrc || "/images/blog/agentic-ai-rag/thumb.png"}
              alt={article.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              width={224}
              height={224}
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
          <div className="flex flex-grow flex-col p-5 sm:p-6">
            <header className="mb-2">
              <h3 className="font-display line-clamp-2 text-2xl font-semibold leading-tight tracking-tight transition-colors duration-200 group-hover:text-primary sm:text-[1.7rem]">
                {article.title}
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:text-xs">
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

            <p className="mb-4 line-clamp-3 flex-grow text-sm leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>

            {article.tags && article.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {article.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-foreground/10 bg-secondary/45 px-2.5 py-1 text-[11px] font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <footer className="mt-auto flex items-center justify-between border-t border-foreground/10 pt-3">
              <span className="flex items-center text-sm font-black text-primary">
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
              {typeof article.metrics?.views === "number" && (
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
