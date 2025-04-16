import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Assuming React Router
import { Project } from '@/components/projects/ProjectCard.tsx';
import { cn } from '@/lib/utils';
import { Calendar, ExternalLink } from 'lucide-react';
import { BsGithub } from 'react-icons/bs';

import Breadcrumb from '@/components/ui/Breadcrumb.tsx';
import ProjectSection from '@/components/projects/ProjectSection.tsx';
import TechnologyChip from '@/components/ui/TechnologyChip.tsx';
import ProjectLinkButton from '@/components/projects/ProjectLinkButton.tsx';

interface ProjectViewProps {
  project: Project | null | undefined; // Allow null/undefined if project is loading or not found
  // Optional: Add loading state if fetching data inside this component
  isLoading?: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, isLoading }) => {
  // Handle loading or not found state
  if (isLoading) {
    return <div className="text-center py-20">Loading project...</div>;
  }

  if (!project) {
    return (
      <section className="w-full max-w-5xl mx-auto py-12 md:py-16 px-0 sm:px-6 lg:px-8 min-h-[60vh] flex items-center justify-center">
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

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: project.title },
  ];

  return (
    <motion.section
      className="w-full max-w-5xl mx-auto py-10 md:py-12 px-0 sm:px-6 lg:px-8 min-h-[70vh]"
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
        {project.imageUrl && (
          <div className="w-full h-64 md:h-80 lg:h-96 relative overflow-hidden border-b border-white/20 dark:border-white/10">
            <img
              src={project.imageUrl}
              alt={`Showcase image for ${project.title}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        )}

        {/* Project Details */}
        <div className="p-6 md:p-8 lg:p-10">
          {/* Header Section */}
          <header className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-gray-50">
              {project.title}
            </h1>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Completed on {formattedDate}</span>
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

            {/* Links Section */}
            {(project.projectUrl || project.repoUrl) && (
              <ProjectSection
                title="Project Links"
                contentClassName="flex flex-wrap gap-4"
              >
                {project.projectUrl && (
                  <ProjectLinkButton
                    href={project.projectUrl}
                    icon={<ExternalLink className="w-4 h-4" />}
                    label="Live Demo"
                  />
                )}
                {project.repoUrl && (
                  <ProjectLinkButton
                    href={project.repoUrl}
                    icon={<BsGithub className="w-4 h-4" />}
                    label="Source Code"
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
