"use client";

import {
  ExternalLink,
  FileText,
  Layers,
  PencilLine,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import type React from "react";
import { BsGithub } from "react-icons/bs";

import {
  ReadingShell,
  DetailNotFound,
  DetailSection,
} from "@/components/content/ReadingShell";
import { ContentShareActions } from "@/components/content/ContentShareActions";
import { EditorialCover } from "@/components/content/EditorialCover";
import { Action, Rule, TagList } from "@/components/ds";
import MarkdownView from "@/components/content/MarkdownView";
import { resolveProjectStatus } from "@/lib/content/projectStatus";
import { formatDate } from "@/lib/format";
import type { Project } from "@/types/content";

const ProjectView: React.FC<{
  project: Project | null | undefined;
  canEdit?: boolean;
}> = ({ project, canEdit = false }) => {
  if (!project) {
    return (
      <DetailNotFound
        title="This project isn't here."
        hint="It may have been renamed or unpublished."
        action={
          <Action href="/projects" tone="ink">
            Back to all projects
          </Action>
        }
      />
    );
  }

  const status = resolveProjectStatus(project.status);
  const date = formatDate(project.date, "long");
  const updatedDate = formatDate(
    project.publishedAt ?? project.updatedAt,
    "long",
  );
  const links = [
    project.links?.live && {
      href: project.links.live,
      label: "Live demo",
      icon: <ExternalLink />,
      tone: "ink" as const,
    },
    project.links?.repo && {
      href: project.links.repo,
      label: "Source code",
      icon: <BsGithub />,
      tone: "quiet" as const,
    },
    project.links?.docs && {
      href: project.links.docs,
      label: "Documentation",
      icon: <FileText />,
      tone: "quiet" as const,
    },
    project.links?.video && {
      href: project.links.video,
      label: "Walkthrough",
      icon: <PlayCircle />,
      tone: "quiet" as const,
    },
  ].filter(Boolean) as {
    href: string;
    label: string;
    icon: React.ReactNode;
    tone: "ink" | "quiet";
  }[];

  return (
    <ReadingShell
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: project.title },
      ]}
      eyebrow={status.kicker}
      title={project.title}
      deck={project.subtitle || project.description}
      meta={[
        `${project.status === "in-progress" ? "Updated" : "Shipped"} ${date}`,
        updatedDate ? `Last updated ${updatedDate}` : undefined,
        project.role,
        project.client,
      ]}
      cover={project.media?.imageUrl || project.media?.thumbnailUrl}
      coverAlt={`Cover image for ${project.title}`}
      generatedCover={
        <EditorialCover
          kind="project"
          title={project.title}
          date={formatDate(project.date, "monthYear")}
          details={project.technologies}
          seed={project.slug ?? project._id}
        />
      }
      aside={
        <div className="flex flex-wrap gap-2.5">
          {links.map((link) => (
            <Action
              key={link.href}
              href={link.href}
              tone={link.tone}
              size="sm"
            >
              {link.icon}
              {link.label}
            </Action>
          ))}
          {canEdit ? (
            <Action
              href={`/admin/projects/${project._id}`}
              tone="brand"
              size="sm"
            >
              <PencilLine />
              Edit project
            </Action>
          ) : null}
          <ContentShareActions
            kind="project"
            slug={project.slug ?? project._id}
            title={project.title}
            text={project.subtitle || project.description}
          />
        </div>
      }
    >
      <MarkdownView content={project.content || ""} />

      {project.highlights && project.highlights.length > 0 ? (
        <>
          <Rule className="my-14" />
          <DetailSection title="Highlights" icon={<Sparkles />}>
            <ul className="flex flex-col gap-4">
              {project.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-brand"
                  />
                  <span className="text-[0.9375rem] leading-relaxed text-ink-muted">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          </DetailSection>
        </>
      ) : null}

      {project.technologies.length > 0 ? (
        <>
          <Rule className="my-14" />
          <DetailSection title="Built with" icon={<Layers />}>
            <TagList items={project.technologies} />
          </DetailSection>
        </>
      ) : null}
    </ReadingShell>
  );
};

export default ProjectView;
