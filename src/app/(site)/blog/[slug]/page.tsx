import ArticleView from "@/components/blog/ArticleView";
import { getArticleBySlug } from "@/lib/data/content";
import type { Article } from "@/types";
import { notFound } from "next/navigation";

type Params = { slug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
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
  const { slug } = await params;
  const article = (await getArticleBySlug(slug)) as Article | null;
  if (!article) {
    notFound();
  }
  return <ArticleView article={article} />;
}
