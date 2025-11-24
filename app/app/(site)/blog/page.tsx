import BlogArticlesList from '@/components/blog/BlogArticlesList';
import { getAllArticles } from '@/lib/data/content';

export const metadata = {
  title: 'Blog - Mathis Lambert',
  description: 'Articles and notes by Mathis Lambert.',
};

export default async function BlogPage() {
  const articles = await getAllArticles();
  return <BlogArticlesList articles={articles} />;
}
