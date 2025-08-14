import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProjectCard from '@/components/projects/ProjectCard';
import type { Project } from '@/types';
import { getProjects } from '@/api/projects';
import FiltersBar from '@/components/filters/FiltersBar';
import { useAuth } from '@/hooks/useAuth';

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
type SortOrder = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'featured';

// --- Main Component ---
const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(
    [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const { token } = useAuth();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch projects from API
  useEffect(() => {
    const ac = new AbortController();

    async function fetchProjects() {
      try {
        setIsLoading(true);
        setError(null);
        const normalized = await getProjects({ signal: ac.signal, token: token ?? undefined });
        setProjects(normalized.length ? normalized : []);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('Failed to fetch projects:', e);
        setError('Failed to load projects.');
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
    return () => ac.abort();
  }, [token]);

  // Calculate all unique technologies from the projects
  const allTechnologies = useMemo(() => {
    const techSet = new Set<string>();
    projects.forEach((project) => {
      project.technologies.forEach((tech) => techSet.add(tech));
    });
    return Array.from(techSet).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach((p) => p.categories?.forEach((c) => cats.add(c)));
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  // Filter and sort projects based on state
  const filteredAndSortedProjects = useMemo(() => {
    const tempProjects = projects.filter((project) => {
      // Filter by selected technology
      if (
        selectedTechnologies.length > 0 &&
        !selectedTechnologies.some((t) => project.technologies.includes(t))
      ) {
        return false;
      }
      // Filter by selected category
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.some((c) => (project.categories || []).includes(c))
      ) {
        return false;
      }
      // Filter by status
      if (
        selectedStatuses.length > 0 &&
        (!project.status || !selectedStatuses.includes(project.status))
      ) {
        return false;
      }
      // Featured only
      if (featuredOnly && !project.isFeatured) {
        return false;
      }
      // Filter by search query (case-insensitive)
      if (debouncedSearchQuery) {
        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        const isInTitle = project.title.toLowerCase().includes(lowerCaseQuery);
        const isInSubtitle = (project.subtitle || '')
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInDescription = project.description
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInTechnologies = project.technologies.some((tech) =>
          tech.toLowerCase().includes(lowerCaseQuery),
        );
        const isInCategories = (project.categories || []).some((cat) =>
          cat.toLowerCase().includes(lowerCaseQuery),
        );
        const isInClient = (project.client || '')
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInRole = (project.role || '')
          .toLowerCase()
          .includes(lowerCaseQuery);
        if (
          !isInTitle &&
          !isInSubtitle &&
          !isInDescription &&
          !isInTechnologies &&
          !isInCategories &&
          !isInClient &&
          !isInRole
        ) {
          return false;
        }
      }
      return true;
    });

    // Sort the filtered projects
    const sortedProjects = [...tempProjects];
    if (sortOrder === 'newest') {
      sortedProjects.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else if (sortOrder === 'oldest') {
      sortedProjects.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    } else if (sortOrder === 'a-z') {
      sortedProjects.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'z-a') {
      sortedProjects.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOrder === 'featured') {
      sortedProjects.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    return sortedProjects;
  }, [
    projects,
    selectedTechnologies,
    selectedCategories,
    selectedStatuses,
    featuredOnly,
    debouncedSearchQuery,
    sortOrder,
  ]);

  return (
    <section className="w-full max-w-7xl mx-auto py-12 md:py-16 px-0 sm:px-6 lg:px-8 min-h-[60vh]">
      {/* Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onSortChange={(v) => setSortOrder(v as SortOrder)}
          filteredCount={filteredAndSortedProjects.length}
          onReset={() => {
            setSearchQuery('');
            setSelectedTechnologies([]);
            setSelectedCategories([]);
            setSelectedStatuses([]);
            setFeaturedOnly(false);
            setSortOrder('newest');
          }}
          sections={[
            {
              type: 'multiselect',
              label: 'Technologies',
              items: allTechnologies.map((t) => ({ value: t, label: t })),
              selected: selectedTechnologies,
              onChange: setSelectedTechnologies,
            },
            {
              type: 'multiselect',
              label: 'Categories',
              items: allCategories.map((c) => ({ value: c, label: c })),
              selected: selectedCategories,
              onChange: setSelectedCategories,
            },
            {
              type: 'multiselect',
              label: 'Status',
              items: [
                { value: 'in-progress', label: 'In progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'archived', label: 'Archived' },
              ],
              selected: selectedStatuses,
              onChange: setSelectedStatuses,
            },
          ]}
          showFeaturedToggle
          featuredOnly={featuredOnly}
          onFeaturedChange={setFeaturedOnly}
          searchPlaceholder="Search by title, description, technology, client..."
          searchAriaLabel="Search projects"
          sortOptions={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'a-z', label: 'A → Z' },
            { value: 'z-a', label: 'Z → A' },
            { value: 'featured', label: 'Featured first' },
          ]}
        />
      </motion.div>

      {/* Project Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading-projects"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-3xl h-60 animate-pulse bg-white/20 dark:bg-gray-800/30 border border-white/20 dark:border-white/10"
              />
            ))}
          </motion.div>
        ) : filteredAndSortedProjects.length > 0 ? (
          <motion.div
            key={[
              'tech:' + selectedTechnologies.join(','),
              'cat:' + selectedCategories.join(','),
              'status:' + selectedStatuses.join(','),
              featuredOnly ? 'feat' : 'all',
              'q:' + debouncedSearchQuery,
              'sort:' + sortOrder,
            ].join('|')}
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
              No projects match your criteria.
            </p>
            <p className="mt-1 text-sm">
              Try adjusting your search or filters.
            </p>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProjectsList;
