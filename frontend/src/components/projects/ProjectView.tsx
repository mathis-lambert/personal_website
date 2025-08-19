import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Project } from '@/types';
import { cn } from '@/lib/utils';
import { Calendar, ExternalLink, Star } from 'lucide-react';
import { BsGithub } from 'react-icons/bs';

import Breadcrumb from '@/components/ui/Breadcrumb.tsx';
import ProjectSection from '@/components/projects/ProjectSection.tsx';
import TechnologyChip from '@/components/ui/TechnologyChip.tsx';
import ProjectLinkButton from '@/components/projects/ProjectLinkButton.tsx';

interface ProjectViewProps {
  project: Project | null | undefined; // Allow null/undefined if project is loading or not found
  isLoading?: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, isLoading }) => {
  // Handle loading with a rich skeleton UI
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
            <div className="w-full h-64 md:h-80 lg:h-96 relative overflow-hidden border-b border-white/20 dark:border-white/10 bg-gray-200/60 dark:bg-gray-700/40" />
            <div className="p-6 md:p-8 lg:p-10">
              <div className="h-8 w-2/3 rounded bg-gray-200/70 dark:bg-gray-700/50" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-200/60 dark:bg-gray-700/40" />
              <div className="mt-4 h-4 w-40 rounded bg-gray-200/60 dark:bg-gray-700/40" />

              <div className="mt-8 space-y-6 md:space-y-8">
                <div>
                  <div className="h-5 w-40 rounded bg-gray-200/70 dark:bg-gray-700/50 mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-gray-200/60 dark:bg-gray-700/40" />
                    <div className="h-4 w-11/12 rounded bg-gray-200/60 dark:bg-gray-700/40" />
                    <div className="h-4 w-10/12 rounded bg-gray-200/60 dark:bg-gray-700/40" />
                  </div>
                </div>

                <div>
                  <div className="h-5 w-48 rounded bg-gray-200/70 dark:bg-gray-700/50 mb-3" />
                  <div className="flex flex-wrap gap-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-7 w-20 rounded-full bg-gray-200/60 dark:bg-gray-700/40"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="h-5 w-36 rounded bg-gray-200/70 dark:bg-gray-700/50 mb-3" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-4 w-[90%] rounded bg-gray-200/60 dark:bg-gray-700/40"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="h-5 w-32 rounded bg-gray-200/70 dark:bg-gray-700/50 mb-3" />
                  <div className="flex flex-wrap gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-9 w-28 rounded-md bg-gray-200/60 dark:bg-gray-700/40"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  if (!project) {
    return (
      <section className="w-full max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-2xl mb-3 font-mono">( T _ T )</p>
          <p className="text-xl font-semibold">Project Not Found</p>
          <p className="mt-2">The requested project could not be loaded.</p>
          <Link
            to="/projects"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
            Return to Projects List
          </Link>
        </div>
      </section>
    );
  }

  // Format date nicely
  const formattedDate = new Date(project.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const liveUrl = project.links?.live || project.projectUrl;
  const repoUrl = project.links?.repo || project.repoUrl;
  const imageSrc =
    project.media?.imageUrl ||
    project.media?.thumbnailUrl ||
    project.imageUrl ||
    project.thumbnailUrl;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: project.title },
  ];

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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
      >
        {imageSrc && (
          <div className="w-full h-64 md:h-80 lg:h-96 relative overflow-hidden border-b border-white/20 dark:border-white/10">
            <img
              src={imageSrc}
              alt={`Showcase image for ${project.title}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            {project.isFeatured && (
              <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-400/90 text-black backdrop-blur-sm border border-black/10 shadow-sm">
                <Star className="w-3.5 h-3.5" /> Featured
              </span>
            )}
          </div>
        )}

        {/* Project Details */}
        <div className="p-6 md:p-8 lg:p-10">
          {/* Header Section */}
          <header className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-1 text-gray-900 dark:text-gray-50">
              {project.title}
            </h1>
            {project.subtitle && (
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3">
                {project.subtitle}
              </p>
            )}
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                {project.status === 'in-progress'
                  ? 'Updated on'
                  : 'Completed on'}{' '}
                {formattedDate}
              </span>
            </div>
          </header>

          {/* Sections */}
          <div className="space-y-6 md:space-y-8">
            <ProjectSection title="Project Overview">
              <p className="text-base whitespace-pre-line">
                {project.description}
              </p>
            </ProjectSection>

            {/* Technologies Section */}
            {project.technologies && project.technologies.length > 0 && (
              <ProjectSection
                title="Technologies Used"
                contentClassName="flex flex-wrap gap-2.5"
              >
                {project.technologies.map((tech) => (
                  <TechnologyChip key={tech} technology={tech} />
                ))}
              </ProjectSection>
            )}

            {/* Highlights Section */}
            {project.highlights && project.highlights.length > 0 && (
              <ProjectSection title="Highlights" contentClassName="grid gap-2">
                <ul className="list-disc pl-5 space-y-1">
                  {project.highlights.map((h, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {h}
                    </li>
                  ))}
                </ul>
              </ProjectSection>
            )}

            {/* Links Section */}
            {(liveUrl ||
              repoUrl ||
              project.links?.docs ||
              project.links?.video) && (
                <ProjectSection
                  title="Project Links"
                  contentClassName="flex flex-wrap gap-4"
                >
                  {liveUrl && (
                    <ProjectLinkButton
                      href={liveUrl}
                      icon={<ExternalLink className="w-4 h-4" />}
                      label="Live Demo"
                    />
                  )}
                  {repoUrl && (
                    <ProjectLinkButton
                      href={repoUrl}
                      icon={<BsGithub className="w-4 h-4" />}
                      label="Source Code"
                    />
                  )}
                  {project.links?.docs && (
                    <ProjectLinkButton
                      href={project.links.docs}
                      icon={<span className="text-xs">📄</span>}
                      label="Docs"
                    />
                  )}
                  {project.links?.video && (
                    <ProjectLinkButton
                      href={project.links.video}
                      icon={<span className="text-xs">🎬</span>}
                      label="Video"
                    />
                  )}
                </ProjectSection>
              )}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default ProjectView;
