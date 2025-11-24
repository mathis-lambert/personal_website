'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Heading2 } from '@/components/ui/Headings';
import { Button } from '@/components/ui/button';

const BlogHeroSection: React.FC = () => {
  return (
    <section className="py-16 text-white">
      <div className="container mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Heading2 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to My Blog
          </Heading2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.3 }}
          className="text-lg md:text-xl mb-8 text-gray-600 dark:text-gray-200"
        >
          Modern insights and classy articles on technology, design, and
          innovation.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Button variant="default" className="mx-auto">
            Discover More
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default BlogHeroSection;
