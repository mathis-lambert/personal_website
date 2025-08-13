import { useEffect, useState } from 'react';
import GlassCardsList from '@/components/ui/GlassCardsList.tsx';
import { HeroSection } from '@/components/ui/HeroSection.tsx';
import ProjectCard from '@/components/projects/ProjectCard';
import type { Project } from '@/types';
import BlogArticleCard from '@/components/blog/BlogArticleCard';
import { Link } from 'react-router-dom';
import { getProjects } from '@/api/projects';

type Article = {
  id: string | number;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  readTime: string;
  tags: string[];
};

const articlesPreview: Article[] = [
  {
    id: 'a1',
    title: 'The Future of AI in Everyday Life',
    excerpt:
      'Discover how artificial intelligence is transforming daily tasks...',
    imageUrl: '/images/blog/article1.jpg',
    date: '2025-04-15',
    readTime: '5 min read',
    tags: ['AI', 'Technology'],
  },
  {
    id: 'a2',
    title: 'Design Trends 2025: Minimalism and Beyond',
    excerpt: 'A look into the emerging design trends...',
    imageUrl: '/images/blog/article2.jpeg',
    date: '2025-03-22',
    readTime: '7 min read',
    tags: ['Design', 'UI/UX'],
  },
  {
    id: 'a3',
    title: 'How to Build Modern Web Applications',
    excerpt: 'Explore the best practices and modern technologies...',
    imageUrl: '/images/blog/article3.avif',
    date: '2025-02-10',
    readTime: '6 min read',
    tags: ['Web', 'React'],
  },
];

const HomePage = () => {
  const [featured, setFeatured] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    async function fetchFeatured() {
      try {
        setIsLoading(true);
        setError(null);
        const normalized: Project[] = await getProjects({ signal: ac.signal });
        const byDateDesc = (a: Project, b: Project) =>
          new Date(b.date).getTime() - new Date(a.date).getTime();
        const featuredOnly = normalized.filter((p) => p.isFeatured);
        const top = (featuredOnly.length ? featuredOnly : normalized)
          .sort(byDateDesc)
          .slice(0, 3);
        setFeatured(top);
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
  }, []);

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
          {articlesPreview.map((a, i) => (
            <BlogArticleCard key={a.id} article={a} animationDelay={i * 0.08} />
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
