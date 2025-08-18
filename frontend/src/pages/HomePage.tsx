import { useEffect, useState } from 'react';
import GlassCardsList from '@/components/ui/GlassCardsList.tsx';
import { HeroSection } from '@/components/ui/HeroSection.tsx';
import ProjectCard from '@/components/projects/ProjectCard';
import type { Project, Article } from '@/types';
import BlogArticleCard from '@/components/blog/BlogArticleCard';
import { Link } from 'react-router-dom';
import { getProjects } from '@/api/projects';
import { getArticles } from '@/api/articles';
import { useAuth } from '@/hooks/useAuth';

const HomePage = () => {
  const [featured, setFeatured] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = useState<boolean>(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const ac = new AbortController();
    async function fetchFeatured() {
      try {
        setError(null);
        const normalized: Project[] = await getProjects({ signal: ac.signal, token: token ?? undefined });
        const byDateDesc = (a: Project, b: Project) =>
          new Date(b.date).getTime() - new Date(a.date).getTime();
        const featuredOnly = normalized.filter((p) => p.isFeatured);
        const top = (featuredOnly.length ? featuredOnly : normalized)
          .sort(byDateDesc)
          .slice(0, 3);
        if (JSON.stringify(top) !== JSON.stringify(featured)) {
          setFeatured(top);
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('Failed to fetch featured projects:', e);
        setError('Impossible de charger les projets à la une.');
        setFeatured([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeatured();
    return () => ac.abort();
  }, [token, featured]);

  useEffect(() => {
    const ac = new AbortController();
    async function fetchArticles() {
      try {
        setArticlesError(null);
        const normalized: Article[] = await getArticles({ signal: ac.signal, token: token ?? undefined });
        const byDateDesc = (a: Article, b: Article) =>
          new Date(b.date).getTime() - new Date(a.date).getTime();
        const top = normalized.sort(byDateDesc).slice(0, 3);
        if (JSON.stringify(top) !== JSON.stringify(latestArticles)) {
          setLatestArticles(top);
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('Failed to fetch latest articles:', e);
        setArticlesError('Impossible de charger les articles.');
        setLatestArticles([]);
      } finally {
        setIsArticlesLoading(false);
      }
    }
    fetchArticles();
    return () => ac.abort();
  }, [token, latestArticles]);

  return (
    <>
      <HeroSection />
      <GlassCardsList />

      {/* Featured Projects */}
      <section className="max-w-7xl mx-auto py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Featured Projects</h2>
          <Link to="/projects" className="text-sky-600 hover:underline">
            See all
          </Link>
        </div>
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl h-60 animate-pulse bg-white/20 dark:bg-gray-800/30 border border-white/20 dark:border-white/10"
              />
            ))
            : featured.map((p, i) => (
              <ProjectCard key={p.id} project={p} animationDelay={i * 0.08} />
            ))}
        </div>
        {!isLoading && featured.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {error ?? 'Aucun projet disponible.'}
          </p>
        )}
      </section>

      {/* Latest Articles */}
      <section className="max-w-7xl mx-auto pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Latest Articles</h2>
          <Link to="/blog" className="text-sky-600 hover:underline">
            See all
          </Link>
        </div>
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {isArticlesLoading
            ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl h-60 animate-pulse bg-white/20 dark:bg-gray-800/30 border border-white/20 dark:border-white/10"
              />
            ))
            : latestArticles.map((a, i) => (
              <BlogArticleCard
                key={a.id}
                article={a}
                animationDelay={i * 0.08}
              />
            ))}
        </div>
        {!isArticlesLoading && latestArticles.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {articlesError ?? 'Aucun article disponible.'}
          </p>
        )}
      </section>
    </>
  );
};

export default HomePage;
