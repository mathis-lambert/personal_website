import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ExternalLink, Star } from 'lucide-react';
import { BsGithub } from 'react-icons/bs';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  animationDelay?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  animationDelay = 0.1,
}) => {
  // Format date (e.g., "Apr 2025" or "2025" if only year is needed)
  const formattedDate = new Date(project.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    // day: 'numeric', // Optional: Remove day if not needed for projects
    timeZone: 'UTC', // Add timezone to avoid off-by-one day issues
  });

  const liveUrl = project.links?.live || project.projectUrl;
  const repoUrl = project.links?.repo || project.repoUrl;
  const imageSrc =
    project.media?.thumbnailUrl ||
    project.thumbnailUrl ||
    project.media?.imageUrl ||
    project.imageUrl ||
    '/images/projects/project1.jpg';
  const isFeatured = Boolean(project.isFeatured);
  const status = project.status || 'completed';

  const statusClass =
    status === 'completed'
      ? 'bg-emerald-500/80 text-white border-white/10'
      : status === 'in-progress'
        ? 'bg-amber-500/80 text-white border-white/10'
        : 'bg-gray-500/70 text-white border-white/10';

  return (
    <motion.div
      className="group w-full h-full"
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: animationDelay, duration: 0.4, ease: 'easeOut' },
      }}
      exit={{ opacity: 0, y: 30 }}
      layout // Add layout prop for smoother transitions when filtering/sorting
    >
      {/* Link the whole card to a project detail page */}
      <Link
        to={`/projects/${project.slug || project.id}`}
        className="block w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black/10 dark:focus-visible:ring-offset-black/30 rounded-3xl"
        aria-label={`View details for ${project.title}`}
      >
        <div
          className={cn(
            `flex flex-col h-full rounded-3xl backdrop-blur-xl border border-white/40 relative shadow-md overflow-hidden`,
            `transition-all duration-300 ease-in-out group-hover:scale-[1.02] group-hover:shadow-xl`,
            `bg-white/30 dark:bg-gray-800/30 dark:text-gray-100 dark:border-white/10 dark:shadow-lg`,
          )}
        >
          {/* Image Section */}
          <div className="relative w-full h-40 sm:h-48 overflow-hidden">
            <img
              src={imageSrc}
              alt={`Screenshot of ${project.title}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
            {isFeatured && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-400/90 text-black backdrop-blur-sm border border-black/10 shadow-sm">
                <Star className="w-3.5 h-3.5" /> Featured
              </span>
            )}
            {/* Optionally display first technology like a primary tag */}
            {project.technologies.length > 0 && (
              <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full bg-teal-500/70 text-white backdrop-blur-sm border border-white/10 shadow-sm">
                {project.technologies[0]}
              </span>
            )}
            {/* Status badge */}
            <span
              className={cn(
                'absolute bottom-3 left-3 text-[10px] px-2 py-0.5 rounded-full border shadow-sm',
                statusClass,
              )}
            >
              {status === 'in-progress'
                ? 'In progress'
                : status === 'archived'
                  ? 'Archived'
                  : 'Completed'}
            </span>
          </div>

          {/* Content Section */}
          <div className="p-3 sm:p-4 flex flex-col flex-grow">
            {/* Project Title */}
            <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
              {project.title}
            </h3>
            {project.subtitle && (
              <p className="-mt-1 mb-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {project.subtitle}
              </p>
            )}

            {/* Project Description */}
            <p
              className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex-grow line-clamp-3" // Always show description, adjust line-clamp if needed
            >
              {project.description}
            </p>

            {/* Technology Tags */}
            {project.technologies && project.technologies.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {project.technologies.slice(0, 4).map(
                  (
                    tech, // Show maybe up to 4 techs
                  ) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-white/10 backdrop-blur-sm text-gray-700 dark:text-gray-300"
                    >
                      {tech}
                    </span>
                  ),
                )}
              </div>
            )}

            {/* Footer: Date and Links + metrics */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/20 dark:border-white/15">
              {/* Formatted Date */}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formattedDate}
              </span>

              {/* External Links (Live Demo, Repo) */}
              <div className="flex items-center gap-3">
                {typeof project.metrics?.stars === 'number' && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {project.metrics.stars}
                  </span>
                )}
                {liveUrl && (
                  <Link
                    to={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Prevent card link navigation
                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-sm"
                    aria-label={`View live demo of ${project.title}`}
                    title="View Live Demo"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                {repoUrl && (
                  <Link
                    to={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Prevent card link navigation
                    className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-sm"
                    aria-label={`View source code of ${project.title} on GitHub`}
                    title="View Source Code"
                  >
                    <BsGithub className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProjectCard;
