"use client";

import { Calendar, ExternalLink, UserRound } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { BsGithub } from "react-icons/bs";

import { trackUiEvent } from "@/api/analytics";
import { ContentCard } from "@/components/content/ContentCard";
import { GeneratedEditorialCover } from "@/components/content/GeneratedEditorialCover";
import { resolveProjectStatus } from "@/lib/content/projectStatus";
import { formatDate } from "@/lib/format";
import type { Project } from "@/types/content";

const ProjectCard: React.FC<{ project: Project; priority?: boolean }> = ({
  project,
  priority = false,
}) => {
  const href = `/projects/${project.slug || project._id}`;
  const status = resolveProjectStatus(project.status);
  const StatusIcon = status.icon;


  const trackExternal = (target: "live" | "repo", url: string) =>
    void trackUiEvent({
      name: "project_external_open",
      properties: { slug: project.slug ?? project._id, target, href: url },
    });

  const liveUrl = project.links?.live;
  const repoUrl = project.links?.repo;

  return (
    <ContentCard
      href={href}
      title={project.title}
      eyebrow={status.kicker}
      eyebrowIcon={<StatusIcon />}
      description={project.description || project.content?.slice(0, 140)}
      meta={[
        { icon: <Calendar />, text: formatDate(project.date, "monthYear") },
        (project.role || project.client) && {
          icon: <UserRound />,
          text: project.role || project.client || "",
        },
      ]}
      tags={project.technologies}
      image={project.media?.thumbnailUrl || project.media?.imageUrl}
      imageAlt={`Cover image for ${project.title}`}
      generatedCover={
        <GeneratedEditorialCover
          compact
          kind="project"
          title={project.title}
          eyebrow={status.kicker}
          date={formatDate(project.date, "monthYear")}
          details={project.technologies}
        />
      }
      priority={priority}
      featured={Boolean(project.isFeatured)}
      cta="Read the write-up"
      onOpen={() =>
        void trackUiEvent({
          name: "project_open",
          path: href,
          properties: {
            slug: project.slug ?? project._id,
            title: project.title,
          },
        })
      }
      actions={
        liveUrl || repoUrl ? (
          <>
            {liveUrl ? (
              <Link
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackExternal("live", liveUrl)}
                title="Live demo"
                aria-label={`Open the live demo of ${project.title}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-bold text-ink-faint transition-colors duration-200 hover:bg-paper-sink hover:text-ink"
              >
                <ExternalLink className="size-3.5" /> Demo
              </Link>
            ) : null}
            {repoUrl ? (
              <Link
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackExternal("repo", repoUrl)}
                title="Source code"
                aria-label={`Open the source code of ${project.title}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-bold text-ink-faint transition-colors duration-200 hover:bg-paper-sink hover:text-ink"
              >
                <BsGithub className="size-3.5" /> Code
              </Link>
            ) : null}
          </>
        ) : null
      }
    />
  );
};

export default ProjectCard;
