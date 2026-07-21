"use client";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Star } from "lucide-react";
import { BsGithub } from "react-icons/bs";
import type { Project } from "@/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { trackUiEvent } from "@/api/analytics";

interface ProjectCardProps {
  project: Project;
  eagerImage?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  eagerImage = false,
}) => {
  const router = useRouter();
  const detailsPath = `/projects/${project.slug || project._id}`;

  const formattedDate = new Date(project.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  const liveUrl = project.links?.live;
  const repoUrl = project.links?.repo;
  const imageSrc = project.media?.thumbnailUrl || project.media?.imageUrl;
  const isFeatured = Boolean(project.isFeatured);
  const status = project.status || "completed";

  const statusClass =
    status === "completed"
      ? "bg-emerald-500/80 text-white border-white/10"
      : status === "in-progress"
        ? "bg-amber-500/80 text-white border-white/10"
        : "bg-gray-500/70 text-white border-white/10";

  const openDetails = () => {
    void trackUiEvent({
      name: "project_open",
      path: detailsPath,
      properties: {
        slug: project.slug ?? project._id,
        title: project.title,
      },
    });
    router.push(detailsPath);
  };

  return (
    <div className="group h-full w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={openDetails}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetails();
          }
        }}
        aria-label={`View details for ${project.title}`}
        className="block h-full w-full cursor-pointer rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div
          className={cn(
            "paper-surface relative flex h-full flex-col overflow-hidden rounded-[2rem]",
            "transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-2xl",
          )}
        >
          <div className="relative h-48 w-full overflow-hidden sm:h-56">
            <Image
              src={imageSrc || "/images/projects/personal-website/thumb.png"}
              alt={`Screenshot of ${project.title}`}
              loading={eagerImage ? "eager" : "lazy"}
              fetchPriority={eagerImage ? "low" : "auto"}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              width={384}
              height={192}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#152e35]/75 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
            {isFeatured && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-400/90 text-black backdrop-blur-sm border border-black/10 shadow-sm">
                <Star className="w-3.5 h-3.5" /> Featured
              </span>
            )}
            {project.technologies.length > 0 && (
              <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full bg-teal-500/70 text-white backdrop-blur-sm border border-white/10 shadow-sm">
                {project.technologies[0]}
              </span>
            )}
            <span
              className={cn(
                "absolute bottom-3 left-3 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm",
                statusClass,
              )}
            >
              {status === "in-progress"
                ? "In progress"
                : status === "archived"
                  ? "Archived"
                  : "Completed"}
            </span>
          </div>

          <div className="flex flex-grow flex-col p-5 sm:p-6">
            <h3 className="font-display mb-2 line-clamp-2 text-2xl font-semibold leading-tight transition-colors duration-200 group-hover:text-primary sm:text-[1.7rem]">
              {project.title}
            </h3>
            {project.subtitle && (
              <p className="-mt-1 mb-3 line-clamp-1 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {project.subtitle}
              </p>
            )}

            <p className="mb-4 line-clamp-3 flex-grow text-sm leading-relaxed text-muted-foreground">
              {project.description || project.content?.slice(0, 100)}...
            </p>

            {project.technologies && project.technologies.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {project.technologies.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-foreground/10 bg-secondary/45 px-2.5 py-1 text-[11px] font-bold"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between border-t border-foreground/10 pt-3">
              <span className="text-xs font-bold text-muted-foreground">
                {formattedDate}
              </span>

              <div className="flex items-center gap-3">
                {typeof project.metrics?.stars === "number" && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {project.metrics.stars}
                  </span>
                )}
                {liveUrl && (
                  <Link
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      void trackUiEvent({
                        name: "project_external_open",
                        properties: {
                          slug: project.slug ?? project._id,
                          target: "live",
                          href: liveUrl,
                        },
                      });
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label={`View live demo of ${project.title}`}
                    title="View Live Demo"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                {repoUrl && (
                  <Link
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      void trackUiEvent({
                        name: "project_external_open",
                        properties: {
                          slug: project.slug ?? project._id,
                          target: "repo",
                          href: repoUrl,
                        },
                      });
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
      </div>
    </div>
  );
};

export default ProjectCard;
