import ArticleView from '@/components/blog/ArticleView';
import { getAllArticles, getArticleBySlug } from '@/lib/data/content';
import type { Article } from '@/types';
import { notFound } from 'next/navigation';

type Params = { slug: string };

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles
    .filter((a) => a.slug)
    .map((a) => ({ slug: a.slug! }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: 'Article not found' };
  return {
    title: `${article.title} – Blog`,
    description: article.excerpt,
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Params;
}) {
  const article = (await getArticleBySlug(params.slug)) as Article | null;
  if (!article) {
    notFound();
  }
  return <ArticleView article={article} />;
}
