"use client";

import { FolderOpen } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";

import { ListHeader } from "@/components/content/ListHeader";
import { CardGrid, EmptyState, Page, Reveal } from "@/components/ds";
import FiltersBar from "@/components/filters/FiltersBar";
import ProjectCard from "@/components/projects/ProjectCard";
import { useDebounce } from "@/hooks/useDebounce";
import { PROJECT_STATUS_FILTER_OPTIONS } from "@/lib/content/projectStatus";
import {
  SORT_OPTIONS,
  matchesQuery,
  sortContent,
  uniqueSorted,
  type SortOrder,
} from "@/lib/content/sort";
import type { Project } from "@/types";

const ProjectsList: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const query = useDebounce(searchQuery);

  const allTechnologies = useMemo(
    () => uniqueSorted(projects.flatMap((project) => project.technologies)),
    [projects],
  );

  const allCategories = useMemo(
    () => uniqueSorted(projects.flatMap((project) => project.categories ?? [])),
    [projects],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      if (
        technologies.length > 0 &&
        !technologies.some((tech) => project.technologies.includes(tech))
      ) {
        return false;
      }
      if (
        categories.length > 0 &&
        !categories.some((category) =>
          (project.categories ?? []).includes(category),
        )
      ) {
        return false;
      }
      if (
        statuses.length > 0 &&
        (!project.status || !statuses.includes(project.status))
      ) {
        return false;
      }
      if (featuredOnly && !project.isFeatured) return false;

      return matchesQuery(
        [
          project.title,
          project.subtitle,
          project.description,
          project.content,
          project.client,
          project.role,
          ...project.technologies,
          ...(project.categories ?? []),
        ],
        needle,
      );
    });

    return sortContent(filtered, sortOrder);
  }, [
    projects,
    technologies,
    categories,
    statuses,
    featuredOnly,
    query,
    sortOrder,
  ]);

  return (
    <Page as="section" data-ink="coral">
      <ListHeader
        eyebrow={`Selected work · ${projects.length} ${projects.length === 1 ? "case study" : "case studies"}`}
        icon={<FolderOpen />}
        title="Things I've made, broken, and made better."
        deck="AI systems, developer tools and product experiments. Each one is written up with the decisions behind it, not just the screenshots."
      />

      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={(value) => setSortOrder(value as SortOrder)}
        filteredCount={visible.length}
        totalCount={projects.length}
        onReset={() => {
          setSearchQuery("");
          setTechnologies([]);
          setCategories([]);
          setStatuses([]);
          setFeaturedOnly(false);
          setSortOrder("newest");
        }}
        sections={[
          {
            type: "multiselect",
            label: "Tech",
            items: allTechnologies.map((value) => ({ value, label: value })),
            selected: technologies,
            onChange: setTechnologies,
          },
          {
            type: "multiselect",
            label: "Category",
            items: allCategories.map((value) => ({ value, label: value })),
            selected: categories,
            onChange: setCategories,
          },
          {
            type: "multiselect",
            label: "Status",
            items: PROJECT_STATUS_FILTER_OPTIONS,
            selected: statuses,
            onChange: setStatuses,
          },
        ]}
        showFeaturedToggle
        featuredOnly={featuredOnly}
        onFeaturedChange={setFeaturedOnly}
        searchPlaceholder="Search projects, tech, clients…"
        searchAriaLabel="Search projects"
        sortOptions={SORT_OPTIONS}
      />

      {/* No `key` on the grid, so re-filtering doesn't remount every card. */}
      {visible.length > 0 ? (
        <CardGrid className="pb-24">
          {visible.map((project, index) => (
            <Reveal key={project._id} delay={Math.min(index, 5) * 60}>
              <ProjectCard project={project} priority={index < 3} />
            </Reveal>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title="Nothing matches those filters."
          hint="Try a broader search, or reset the filters above."
          className="mb-24"
        />
      )}
    </Page>
  );
};

export default ProjectsList;
