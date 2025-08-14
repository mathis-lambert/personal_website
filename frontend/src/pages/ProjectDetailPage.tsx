import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProjectView from '@/components/projects/ProjectView.tsx';
import type { Project } from '@/types';
import { getProjectBySlug } from '@/api/projects';
import { useAuth } from '@/hooks/useAuth';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const ac = new AbortController();

    async function fetchProject() {
      try {
        setIsLoading(true);
        if (!projectId) {
          setProject(null);
          return;
        }
        const result = await getProjectBySlug(projectId, { signal: ac.signal, token: token ?? undefined });
        setProject(result);
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
  }, [projectId, token]);

  return <ProjectView project={project} isLoading={isLoading} />;
};

export default ProjectDetailPage;
