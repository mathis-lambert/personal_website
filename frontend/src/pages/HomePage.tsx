import GlassCardsList from '@/components/ui/GlassCardsList.tsx';
import { HeroSection } from '@/components/ui/HeroSection.tsx';
import ProjectCard, { type Project } from '@/components/projects/ProjectCard';
import { mockProjects } from '@/components/projects/ProjectsList';
import BlogArticleCard from '@/components/blog/BlogArticleCard';
import { Link } from 'react-router-dom';

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
    excerpt: 'Discover how artificial intelligence is transforming daily tasks...',
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
  const featured = mockProjects.slice(0, 3) as Project[];

  return (
    <>
      <HeroSection />
      <GlassCardsList />

      {/* Featured Projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Featured Projects</h2>
          <Link to="/projects" className="text-sky-600 hover:underline">Voir tous</Link>
        </div>
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <ProjectCard key={p.id} project={p} animationDelay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* Latest Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Latest Articles</h2>
          <Link to="/blog" className="text-sky-600 hover:underline">Voir tous</Link>
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
