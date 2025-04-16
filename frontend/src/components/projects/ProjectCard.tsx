import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Assuming you still want a detail page
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { BsGithub } from 'react-icons/bs'; // Import icons

// --- Interface for Project Data ---
export interface Project {
  id: number | string;
  title: string;
  description: string; // Changed from excerpt
  imageUrl: string;
  date: string; // e.g., 'YYYY-MM-DD' or just 'YYYY-MM' if sorting by month/year
  technologies: string[]; // Changed from tags
  projectUrl?: string; // Optional: Link to live project
  repoUrl?: string; // Optional: Link to code repository
}

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
        to={`/projects/${project.id}`} // Example detail page route
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
              src={project.imageUrl}
              alt={`Screenshot of ${project.title}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
            {/* Optionally display first technology like a primary tag */}
            {project.technologies.length > 0 && (
              <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full bg-teal-500/70 text-white backdrop-blur-sm border border-white/10 shadow-sm">
                {project.technologies[0]}
              </span>
            )}
          </div>

          {/* Content Section */}
          <div className="p-3 sm:p-4 flex flex-col flex-grow">
            {/* Project Title */}
            <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
              {project.title}
            </h3>

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

            {/* Footer: Date and Links */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/20 dark:border-white/15">
              {/* Formatted Date */}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formattedDate}
              </span>

              {/* External Links (Live Demo, Repo) */}
              <div className="flex items-center gap-3">
                {project.projectUrl && (
                  <Link
                    to={project.projectUrl}
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
                {project.repoUrl && (
                  <Link
                    to={project.repoUrl}
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
