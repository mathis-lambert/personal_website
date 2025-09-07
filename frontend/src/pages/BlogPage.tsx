import React from 'react';
import BlogArticlesList from '@/components/blog/BlogArticlesList';

const BlogPage: React.FC = () => {
  return (
    <>
      <title>Blog - Mathis LAMBERT</title>
      <meta name="description" content="Blog articles of Mathis LAMBERT" />
      <link rel="canonical" href="/blog" />
      <meta property="og:title" content="Blog - Mathis LAMBERT" />
      <meta
        property="og:description"
        content="Blog articles of Mathis LAMBERT"
      />
      <meta property="og:url" content="/blog" />
      <meta property="og:type" content="website" />
      <BlogArticlesList />
    </>
  );
};

export default BlogPage;
