"use client";
import React, { useEffect, useMemo, useState } from "react";
import ProjectCard from "@/components/projects/ProjectCard";
import type { Project } from "@/types";
import FiltersBar from "@/components/filters/FiltersBar";

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
type SortOrder = "newest" | "oldest" | "a-z" | "z-a" | "featured";

interface ProjectsListProps {
  projects: Project[];
}

// --- Main Component ---
const ProjectsList: React.FC<ProjectsListProps> = ({ projects }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(
    [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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
        const isInSubtitle = (project.subtitle || "")
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInDescription = (project.description || "")
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInContent = (project.content || "")
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInTechnologies = project.technologies.some((tech) =>
          tech.toLowerCase().includes(lowerCaseQuery),
        );
        const isInCategories = (project.categories || []).some((cat) =>
          cat.toLowerCase().includes(lowerCaseQuery),
        );
        const isInClient = (project.client || "")
          .toLowerCase()
          .includes(lowerCaseQuery);
        const isInRole = (project.role || "")
          .toLowerCase()
          .includes(lowerCaseQuery);
        if (
          !isInTitle &&
          !isInSubtitle &&
          !isInDescription &&
          !isInContent &&
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
    if (sortOrder === "newest") {
      sortedProjects.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else if (sortOrder === "oldest") {
      sortedProjects.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    } else if (sortOrder === "a-z") {
      sortedProjects.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "z-a") {
      sortedProjects.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOrder === "featured") {
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
    <section className="mx-auto min-h-[60vh] w-full max-w-7xl">
      <header className="portfolio-section-enter pb-10 pt-8 sm:pb-14 sm:pt-12">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-primary">Selected builds · {projects.length} case {projects.length === 1 ? "study" : "studies"}</p>
        <h1 className="font-display max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl">Things I&apos;ve made, broken, and made better.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">A growing collection of AI systems, developer tools, and product experiments—each with the decisions behind the build.</p>
      </header>
      {/* Filter Controls */}
      <div className="portfolio-controls-enter">
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onSortChange={(v) => setSortOrder(v as SortOrder)}
          filteredCount={filteredAndSortedProjects.length}
          onReset={() => {
            setSearchQuery("");
            setSelectedTechnologies([]);
            setSelectedCategories([]);
            setSelectedStatuses([]);
            setFeaturedOnly(false);
            setSortOrder("newest");
          }}
          sections={[
            {
              type: "multiselect",
              label: "Technologies",
              items: allTechnologies.map((t) => ({ value: t, label: t })),
              selected: selectedTechnologies,
              onChange: setSelectedTechnologies,
            },
            {
              type: "multiselect",
              label: "Categories",
              items: allCategories.map((c) => ({ value: c, label: c })),
              selected: selectedCategories,
              onChange: setSelectedCategories,
            },
            {
              type: "multiselect",
              label: "Status",
              items: [
                { value: "in-progress", label: "In progress" },
                { value: "completed", label: "Completed" },
                { value: "archived", label: "Archived" },
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
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "a-z", label: "A → Z" },
            { value: "z-a", label: "Z → A" },
            { value: "featured", label: "Featured first" },
          ]}
        />
      </div>

      {/* Project Grid */}
      {filteredAndSortedProjects.length > 0 ? (
        <div
          key={[
            selectedTechnologies.join(","),
            selectedCategories.join(","),
            selectedStatuses.join(","),
            featuredOnly,
            debouncedSearchQuery,
            sortOrder,
          ].join("|")}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {filteredAndSortedProjects.map((project, index) => (
            <div
              key={project._id}
              className="portfolio-card-enter"
              style={
                {
                  "--card-delay": `${Math.min(index, 5) * 55}ms`,
                  "--card-tilt": index % 2 === 0 ? "-0.35deg" : "0.35deg",
                } as React.CSSProperties
              }
            >
              <ProjectCard project={project} eagerImage={index < 6} />
            </div>
          ))}
        </div>
      ) : (
        <div className="portfolio-card-enter py-16 text-center text-gray-500 dark:text-gray-400">
          <p className="mb-3 font-mono text-2xl">( ; ω ; )</p>
          <p className="text-lg font-semibold">
            No projects match your criteria.
          </p>
          <p className="mt-1 text-sm">Try adjusting your search or filters.</p>
        </div>
      )}
    </section>
  );
};

export default ProjectsList;
