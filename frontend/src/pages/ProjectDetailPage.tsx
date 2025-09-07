import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProjectView from '@/components/projects/ProjectView.tsx';
import type { Project } from '@/types';
import { getProjectBySlug } from '@/api/projects';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();

    async function fetchProject() {
      try {
        if (!projectId) {
          setProject(null);
          return;
        }
        const result = await getProjectBySlug(projectId, {
          signal: ac.signal,
        });
        if (JSON.stringify(result) !== JSON.stringify(project)) {
          setProject(result);
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('Failed to fetch project detail:', e);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
    return () => ac.abort();
  }, [projectId, project]);

  return (
    <>
      <title>{project ? `${project.title} - Project` : 'Project Detail'}</title>
      <meta
        name="description"
        content={project ? project.description : 'Project Detail'}
      />
      <link rel="canonical" href={`/projects/${project?.slug}`} />
      <meta
        property="og:title"
        content={project ? `${project.title} - Project` : 'Project Detail'}
      />
      <meta
        property="og:description"
        content={project ? project.description : 'Project Detail'}
      />
      <meta property="og:url" content={`/projects/${project?.slug}`} />
      <meta property="og:type" content="website" />
      <ProjectView project={project} isLoading={isLoading} />
    </>
  );
};

export default ProjectDetailPage;
