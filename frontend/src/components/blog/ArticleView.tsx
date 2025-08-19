import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Article, ArticleMetrics } from '@/types';
import { cn } from '@/lib/utils';
import {
    Star,
    Eye,
    Heart,
    Share2,
    Link as LinkIcon,
    Twitter,
    Linkedin,
} from 'lucide-react';
import MarkdownView from '@/components/ui/MarkdownView';
import Breadcrumb from '@/components/ui/Breadcrumb';
import {
    trackArticleLike,
    trackArticleShare,
    trackArticleRead,
} from '@/api/articles';
import { useAuth } from '@/hooks/useAuth';

interface ArticleViewProps {
    article: Article | null | undefined;
    isLoading?: boolean;
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, isLoading }) => {
    const { token } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [copiedShare, setCopiedShare] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [metrics, setMetrics] = useState<ArticleMetrics | undefined>(
        article?.metrics,
    );
    const breadcrumbItems = useMemo(
        () => [
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: article?.title || 'Article' },
        ],
        [article?.title],
    );

    useEffect(() => {
        setMetrics(article?.metrics);
    }, [article]);

    // Track read when article becomes available (hook must not be conditional)
    useEffect(() => {
        if (!article) return;
        trackArticleRead(article, { token: token ?? undefined })
            .then((m) => {
                if (m) setMetrics(m);
            })
            .catch(() => { });
    }, [article, token]);

    if (isLoading) {
        return (
            <motion.section
                className="w-full max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 min-h-[70vh]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <div className="animate-pulse">
                    <div
                        className={cn(
                            `rounded-3xl backdrop-blur-xl border border-white/30 shadow-lg overflow-hidden`,
                            `bg-white/20 dark:bg-gray-800/25 dark:border-white/10 dark:shadow-xl`,
                        )}
                    >
                        <div className="w-full h-64 md:h-80 relative overflow-hidden border-b border-white/20 dark:border-white/10 bg-gray-200/60 dark:bg-gray-700/40" />
                        <div className="p-6 md:p-8 lg:p-10">
                            <div className="h-8 w-2/3 rounded bg-gray-200/70 dark:bg-gray-700/50" />
                            <div className="mt-3 h-4 w-1/2 rounded bg-gray-200/60 dark:bg-gray-700/40" />
                            <div className="mt-4 h-4 w-40 rounded bg-gray-200/60 dark:bg-gray-700/40" />
                            <div className="mt-8 space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-4 w-[95%] rounded bg-gray-200/60 dark:bg-gray-700/40"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>
        );
    }

    if (!article) {
        return (
            <section className="w-full max-w-5xl mx-auto py-12 md:py-16 px-0 sm:px-6 lg:px-8 min-h-[60vh] flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-2xl mb-3 font-mono">( T _ T )</p>
                    <p className="text-xl font-semibold">Article Not Found</p>
                    <p className="mt-2">The requested article could not be loaded.</p>
                    <Link
                        to="/blog"
                        className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Return to Blog
                    </Link>
                </div>
            </section>
        );
    }

    const formattedDate = new Date(article.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });

    const imageSrc =
        article.media?.imageUrl ||
        article.media?.thumbnailUrl ||
        article.imageUrl ||
        article.thumbnailUrl;

    const readTime =
        typeof article.readTimeMin === 'number'
            ? `${article.readTimeMin} min read`
            : undefined;
    const isFeatured = Boolean(article.isFeatured);
    const likesCount =
        (metrics?.likes ?? article.metrics?.likes ?? 0) +
        (metrics ? 0 : isLiked ? 1 : 0);

    const handleShare = async () => {
        const url = window.location?.href ?? '';
        const shareData = {
            title: article.title,
            text: article.excerpt || article.title,
            url,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                trackArticleShare(article, { token: token ?? undefined })
                    .then((m) => {
                        if (m) setMetrics(m);
                    })
                    .catch(() => { });
                return;
            }
        } catch {
            // ignore
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopiedShare(true);
            trackArticleShare(article, { token: token ?? undefined })
                .then((m) => {
                    if (m) setMetrics(m);
                })
                .catch(() => { });
            setTimeout(() => setCopiedShare(false), 2000);
        } catch {
            // ignore
        }
    };

    const openShareWindow = (shareUrl: string) => {
        const w = 580;
        const h = 400;
        const y = window.top?.outerHeight
            ? Math.max(0, (window.top.outerHeight - h) / 2)
            : 0;
        const x = window.top?.outerWidth
            ? Math.max(0, (window.top.outerWidth - w) / 2)
            : 0;
        window.open(shareUrl, 'share', `width=${w},height=${h},left=${x},top=${y}`);
    };

    return (
        <motion.section
            className="w-full max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 min-h-[70vh]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <Breadcrumb items={breadcrumbItems} />
            <motion.div
                className={cn(
                    `rounded-3xl backdrop-blur-xl border border-white/30 shadow-lg overflow-hidden`,
                    `bg-white/20 dark:bg-gray-800/25 dark:border-white/10 dark:shadow-xl`,
                )}
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
            >
                {imageSrc && (
                    <div className="w-full h-64 md:h-80 relative overflow-hidden border-b border-white/20 dark:border-white/10">
                        <img
                            src={imageSrc}
                            alt={`Cover image for ${article.title}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        {isFeatured && (
                            <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-400/90 text-black backdrop-blur-sm border border-black/10 shadow-sm">
                                <Star className="w-3.5 h-3.5" /> Featured
                            </span>
                        )}
                    </div>
                )}

                <div className="p-6 md:p-8 lg:p-10">
                    <header className="mb-6 md:mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-50">
                            {article.title}
                        </h1>
                        {article.excerpt && (
                            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2">
                                {article.excerpt}
                            </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600 dark:text-gray-400">
                                <span>{formattedDate}</span>
                                {readTime && (
                                    <span className="relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-gray-400 dark:before:text-gray-500">
                                        {readTime}
                                    </span>
                                )}
                                {article.author && (
                                    <span className="relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-gray-400 dark:before:text-gray-500">
                                        By {article.author}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-start sm:justify-end sm:pl-4 sm:border-l sm:border-white/20 dark:sm:border-white/10">
                                {typeof (metrics?.views ?? article.metrics?.views) ===
                                    'number' && (
                                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Eye className="w-3.5 h-3.5" />{' '}
                                            {metrics?.views ?? article.metrics?.views}
                                        </span>
                                    )}
                                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Heart
                                        className={cn('w-3.5 h-3.5', isLiked ? 'text-red-500' : '')}
                                    />{' '}
                                    {likesCount}
                                </span>
                                {typeof (metrics?.shares ?? article.metrics?.shares) ===
                                    'number' && (
                                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Share2 className="w-3.5 h-3.5" />{' '}
                                            {metrics?.shares ?? article.metrics?.shares}
                                        </span>
                                    )}
                            </div>
                            {article.tags && article.tags.length > 0 && (
                                <div className="sm:col-span-2 flex flex-wrap items-center gap-1">
                                    {article.tags.slice(0, 8).map((t) => (
                                        <span
                                            key={t}
                                            className="text-[11px] px-2 py-0.5 rounded-full bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-white/10 backdrop-blur-sm"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                                className={cn(
                                    'inline-flex items-center gap-1.5 text-xs md:text-sm px-3 py-1.5 rounded-full border',
                                    isLiked
                                        ? 'bg-red-500/90 text-white border-red-400/80'
                                        : 'bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-100',
                                )}
                                onClick={() => setIsLiked((v) => !v)}
                                aria-pressed={isLiked}
                                onMouseUp={() =>
                                    trackArticleLike(article, { token: token ?? undefined })
                                        .then((m) => {
                                            if (m) setMetrics(m);
                                        })
                                        .catch(() => { })
                                }
                            >
                                <Heart
                                    className={cn('w-4 h-4', isLiked ? 'fill-current' : '')}
                                />
                                {isLiked ? 'Liked' : 'Like'}
                            </button>
                            <button
                                className={cn(
                                    'inline-flex items-center gap-1.5 text-xs md:text-sm px-3 py-1.5 rounded-full border',
                                    copiedShare
                                        ? 'bg-green-500/90 text-white border-green-400/80'
                                        : 'bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-100',
                                )}
                                onClick={handleShare}
                            >
                                <Share2 className="w-4 h-4" />
                                {copiedShare ? 'Link copied' : 'Share'}
                            </button>
                            <button
                                className="inline-flex items-center gap-1.5 text-xs md:text-sm px-3 py-1.5 rounded-full border bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-100"
                                onClick={() => {
                                    const url = encodeURIComponent(window.location?.href ?? '');
                                    const text = encodeURIComponent(article.title);
                                    openShareWindow(
                                        `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
                                    );
                                }}
                                aria-label="Share on Twitter"
                                title="Share on Twitter"
                                onMouseUp={() =>
                                    trackArticleShare(article, { token: token ?? undefined })
                                        .then((m) => {
                                            if (m) setMetrics(m);
                                        })
                                        .catch(() => { })
                                }
                            >
                                <Twitter className="w-4 h-4" /> Twitter
                            </button>
                            <button
                                className="inline-flex items-center gap-1.5 text-xs md:text-sm px-3 py-1.5 rounded-full border bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-100"
                                onClick={() => {
                                    const url = encodeURIComponent(window.location?.href ?? '');
                                    const title = encodeURIComponent(article.title);
                                    openShareWindow(
                                        `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`,
                                    );
                                }}
                                aria-label="Share on LinkedIn"
                                title="Share on LinkedIn"
                                onMouseUp={() => trackArticleShare(article, { token: token ?? undefined }).catch(() => { })}
                            >
                                <Linkedin className="w-4 h-4" /> LinkedIn
                            </button>
                            <button
                                className={cn(
                                    'inline-flex items-center gap-1.5 text-xs md:text-sm px-3 py-1.5 rounded-full border',
                                    copiedLink
                                        ? 'bg-green-500/90 text-white border-green-400/80'
                                        : 'bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-white/10 text-gray-800 dark:text-gray-100',
                                )}
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(
                                            window.location?.href ?? '',
                                        );
                                        setCopiedLink(true);
                                        trackArticleShare(article, { token: token ?? undefined })
                                            .then((m) => {
                                                if (m) setMetrics(m);
                                            })
                                            .catch(() => { });
                                        setTimeout(() => setCopiedLink(false), 2000);
                                    } catch {
                                        // ignore
                                    }
                                }}
                                aria-label="Copy link"
                                title="Copy link"
                            >
                                <LinkIcon className="w-4 h-4" />{' '}
                                {copiedLink ? 'Copied' : 'Copy link'}
                            </button>
                        </div>
                    </header>

                    <article className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
                        <MarkdownView content={article.content} />
                    </article>

                    {(article.links?.canonical || article.links?.discussion) && (
                        <div className="mt-8 pt-4 border-t border-white/20 dark:border-white/15 text-sm text-blue-600 dark:text-blue-400">
                            {article.links?.canonical && (
                                <a
                                    href={article.links.canonical}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mr-4 hover:underline"
                                >
                                    Canonical
                                </a>
                            )}
                            {article.links?.discussion && (
                                <a
                                    href={article.links.discussion}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                >
                                    Discussion
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.section>
    );
};

export default ArticleView;
