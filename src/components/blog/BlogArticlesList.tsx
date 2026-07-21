"use client";
import React, { useEffect, useMemo, useState } from "react";
import BlogArticleCard from "./BlogArticleCard";
import FiltersBar from "@/components/filters/FiltersBar";
import type { Article } from "@/types";

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
type SortOrder = "newest" | "oldest" | "a-z" | "z-a" | "featured";

// --- Main Component ---
const BlogArticlesList: React.FC<{ articles: Article[] }> = ({ articles }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

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
    if (sortOrder === "newest") {
      sortedArticles.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else if (sortOrder === "oldest") {
      sortedArticles.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    } else if (sortOrder === "a-z") {
      sortedArticles.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "z-a") {
      sortedArticles.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOrder === "featured") {
      sortedArticles.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    return sortedArticles;
  }, [articles, selectedTags, featuredOnly, debouncedSearchQuery, sortOrder]);

  return (
    <section className="mx-auto min-h-[60vh] w-full max-w-7xl">
      <header className="portfolio-section-enter pb-10 pt-8 sm:pb-14 sm:pt-12">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#d95d45]">Field notes · {articles.length} {articles.length === 1 ? "article" : "articles"}</p>
        <h1 className="font-display max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl">Thinking out loud about systems and AI.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Practical lessons, technical deep dives, and honest notes from building software that has to work outside a demo.</p>
      </header>
      <div className="portfolio-controls-enter">
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onSortChange={(v) => setSortOrder(v as SortOrder)}
          filteredCount={filteredAndSortedArticles.length}
          onReset={() => {
            setSearchQuery("");
            setSelectedTags([]);
            setFeaturedOnly(false);
            setSortOrder("newest");
          }}
          sections={[
            {
              type: "multiselect",
              label: "Tags",
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
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "a-z", label: "A → Z" },
            { value: "z-a", label: "Z → A" },
            { value: "featured", label: "Featured first" },
          ]}
        />
      </div>

      {filteredAndSortedArticles.length > 0 ? (
        <div
          key={[
            selectedTags.join(","),
            featuredOnly,
            debouncedSearchQuery,
            sortOrder,
          ].join("|")}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {filteredAndSortedArticles.map((article, index) => (
            <div
              key={article._id}
              className="portfolio-card-enter"
              style={
                {
                  "--card-delay": `${Math.min(index, 5) * 55}ms`,
                  "--card-tilt": index % 2 === 0 ? "-0.35deg" : "0.35deg",
                } as React.CSSProperties
              }
            >
              <BlogArticleCard article={article} eagerImage={index < 6} />
            </div>
          ))}
        </div>
      ) : (
        <div className="portfolio-card-enter py-16 text-center text-gray-500 dark:text-gray-400">
          <p className="mb-3 font-mono text-2xl">( T _ T )</p>
          <p className="text-lg">No articles found.</p>
          <p className="mt-1 text-sm">
            Try a different search term, tag, or sort order.
          </p>
        </div>
      )}
    </section>
  );
};

export default BlogArticlesList;
