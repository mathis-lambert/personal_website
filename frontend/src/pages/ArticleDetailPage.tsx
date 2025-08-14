import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Article } from '@/types';
import { getArticleBySlug } from '@/api/articles';
import ArticleView from '@/components/blog/ArticleView';
import { useAuth } from '@/hooks/useAuth';

const ArticleDetailPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const ac = new AbortController();
    async function fetchArticle() {
      try {
        setIsLoading(true);
        if (!articleId) {
          setArticle(null);
          return;
        }
        const result = await getArticleBySlug(articleId, { signal: ac.signal, token: token ?? undefined });
        setArticle(result);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('Failed to fetch article detail:', e);
        setArticle(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticle();
    return () => ac.abort();
  }, [articleId, token]);

  return <ArticleView article={article} isLoading={isLoading} />;
};

export default ArticleDetailPage;
