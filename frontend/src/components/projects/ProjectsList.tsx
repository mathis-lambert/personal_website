import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProjectCard, { type Project } from '@/components/projects/ProjectCard';
import { cn } from '@/lib/utils';
import { SearchIcon } from 'lucide-react';

// --- Mock Data for Projects ---
// eslint-disable-next-line react-refresh/only-export-components
export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Portfolio Website V3',
    description:
      'My personal portfolio showcasing skills and projects, built with Next.js and Tailwind CSS.',
    imageUrl: '/images/projects/project1.jpg', // Use actual image paths
    date: '2025-03-15',
    technologies: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Framer Motion',
    ],
    projectUrl: 'https://your-portfolio-url.com',
    repoUrl: 'https://github.com/your-username/portfolio-v3',
  },
  {
    id: 'proj-2',
    title: 'E-commerce Platform',
    description:
      'A full-stack e-commerce site with user authentication, product management, and Stripe integration.',
    imageUrl: '/images/projects/project3.avif',
    date: '2024-11-20',
    technologies: [
      'React',
      'Node.js',
      'Express',
      'MongoDB',
      'Redux',
      'Stripe API',
    ],
    projectUrl: 'https://example-ecommerce.com',
    repoUrl: 'https://github.com/your-username/ecommerce-platform',
  },
  {
    id: 'proj-3',
    title: 'Data Visualization Dashboard',
    description:
      'Interactive dashboard displaying complex datasets using D3.js and React.',
    imageUrl: '/images/projects/project4.jpeg',
    date: '2024-06-01',
    technologies: ['React', 'D3.js', 'JavaScript', 'CSS', 'Python', 'Flask'],
    repoUrl: 'https://github.com/your-username/data-viz-dashboard',
  },
  {
    id: 'proj-4',
    title: 'Mobile Weather App',
    description:
      'Cross-platform mobile app providing real-time weather updates using React Native.',
    imageUrl: '/images/projects/project2.jpeg',
    date: '2025-01-10',
    technologies: ['React Native', 'Expo', 'TypeScript', 'Weather API'],
    repoUrl: 'https://github.com/your-username/weather-app-mobile',
  },
];

// --- Debounce Hook (same as before) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Type for Sort Order (same as before) ---
type SortOrder = 'newest' | 'oldest';

// --- Main Component ---
const ProjectsList: React.FC = () => {
  const [projects] = useState<Project[]>(mockProjects); // Use Project interface and data
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState<string | null>(
    null,
  ); // Renamed from selectedTag
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Calculate all unique technologies from the projects
  const allTechnologies = useMemo(() => {
    const techSet = new Set<string>();
    projects.forEach((project) => {
      project.technologies.forEach((tech) => techSet.add(tech));
    });
    return Array.from(techSet).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  // Filter and sort projects based on state
  const filteredAndSortedProjects = useMemo(() => {
    const tempProjects = projects.filter((project) => {
      // Filter by selected technology
      if (
        selectedTechnology &&
        !project.technologies.includes(selectedTechnology)
      ) {
        return false;
      }
      // Filter by search query (case-insensitive)
      if (debouncedSearchQuery) {
        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        const isInTitle = project.title.toLowerCase().includes(lowerCaseQuery);
        const isInDescription = project.description
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInTechnologies = project.technologies.some((tech) =>
          tech.toLowerCase().includes(lowerCaseQuery),
        );
        if (!isInTitle && !isInDescription && !isInTechnologies) {
          return false;
        }
      }
      return true;
    });

    // Sort the filtered projects
    const sortedProjects = [...tempProjects]; // Create a mutable copy
    if (sortOrder === 'newest') {
      sortedProjects.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else if (sortOrder === 'oldest') {
      sortedProjects.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }

    return sortedProjects;
  }, [projects, selectedTechnology, debouncedSearchQuery, sortOrder]);

  // Reusable button component for technology filters
  const TechnologyButton: React.FC<{
    tech: string | null;
    currentTech: string | null;
    onClick: () => void;
  }> = ({ tech, currentTech, onClick }) => (
    <motion.button
      onClick={onClick}
      className={cn(
        `px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ease-out backdrop-blur-sm whitespace-nowrap`,
        `focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/10 dark:focus-visible:ring-offset-black/50`,
        tech === currentTech
          ? 'bg-blue-500/70 border-blue-400/80 text-white shadow-md scale-105' // Active state
          : 'bg-gray-400/10 border-white/20 text-gray-700 hover:bg-white/30 hover:border-white/40 dark:bg-gray-800/20 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:border-white/20', // Inactive state
      )}
      whileHover={{ scale: tech === currentTech ? 1.05 : 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {tech === null ? 'All Technologies' : tech}
    </motion.button>
  );

  return (
    <section className="w-full max-w-7xl mx-auto py-12 md:py-16 px-0 sm:px-6 lg:px-8 min-h-[60vh]">
      {/* Filter Controls */}
      <motion.div
        className="mb-10 md:mb-12 flex flex-col gap-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Search Bar Row */}
        <div className="relative max-w-xl mx-auto w-full">
          <input
            type="text"
            placeholder="Search projects by title, description, or technology..." // Updated placeholder
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search projects"
            className={cn(
              `w-full pl-11 pr-4 py-3 rounded-full backdrop-blur-lg shadow-sm`,
              `bg-white/5 border border-white/20 placeholder-gray-500 dark:placeholder-gray-400`,
              `dark:bg-gray-800/20 dark:border-white/10`,
              `focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/0 focus:bg-white/10 dark:focus:bg-gray-800/30`,
              `transition-all duration-300 ease-in-out text-gray-800 dark:text-gray-100`,
            )}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <SearchIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Filters Row (Technologies and Sort) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Scrollable Technologies */}
          {allTechnologies.length > 0 && (
            <div className="relative flex-grow min-w-0">
              {' '}
              {/* Ensure it can shrink */}
              <div className="flex items-center gap-2.5 overflow-x-auto p-1 -mx-1 no-scrollbar">
                {' '}
                {/* Added padding and negative margin for scroll fade effect */}
                <div className="pl-1"></div>
                {/* Spacer for start */}
                <TechnologyButton
                  tech={null}
                  currentTech={selectedTechnology}
                  onClick={() => setSelectedTechnology(null)}
                />
                {allTechnologies.map((tech) => (
                  <TechnologyButton
                    key={tech}
                    tech={tech}
                    currentTech={selectedTechnology}
                    onClick={() => setSelectedTechnology(tech)}
                  />
                ))}
                <div className="pr-1"></div>
              </div>
            </div>
          )}

          <div className="relative flex-shrink-0">
            {' '}
            {/* Prevent shrinking */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              aria-label="Sort projects by date"
              className={cn(
                `appearance-none pl-4 pr-10 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ease-out backdrop-blur-sm cursor-pointer w-full sm:w-auto`, // Full width on small screens
                `bg-gray-400/10 border-white/20 text-gray-700 hover:bg-white/30 hover:border-white/40`,
                `dark:bg-gray-800/20 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:border-white/20`,
                `focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent`,
                `bg-no-repeat bg-right`,
                `bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]`,
                `dark:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]`,
              )}
              style={{
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25em 1.25em',
              }}
            >
              <option
                value="newest"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                Newest First
              </option>
              <option
                value="oldest"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                Oldest First
              </option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Project Grid */}
      <AnimatePresence mode="wait">
        {filteredAndSortedProjects.length > 0 ? (
          <motion.div
            key={selectedTechnology + debouncedSearchQuery + sortOrder} // Unique key for animation trigger
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3" // Responsive grid
          >
            {filteredAndSortedProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                animationDelay={index * 0.08} // Stagger animation
              />
            ))}
          </motion.div>
        ) : (
          // "No Results" Message
          <motion.div
            key="no-results-projects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16 text-gray-500 dark:text-gray-400"
          >
            <p className="text-2xl mb-3 font-mono">( ; ω ; )</p>
            <p className="text-lg font-semibold">
              No projects found matching your criteria.
            </p>
            <p className="mt-1 text-sm">
              Try adjusting your search or filters.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProjectsList;
