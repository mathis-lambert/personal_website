import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProjectView from '@/components/projects/ProjectView.tsx';
import type { Project } from '@/components/projects/ProjectCard.tsx';
import { mockProjects } from '@/components/projects/ProjectsList.tsx';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  console.log('Project ID:', projectId);
  const [project, setProject] = useState<Project | null | undefined>(undefined); // Start as undefined for loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // --- Simulate fetching project data ---
    // In a real app, you'd fetch from an API:
    // fetch(`/api/projects/${projectId}`)
    //   .then(res => res.json())
    //   .then(data => setProject(data))
    //   .catch(() => setProject(null)) // Handle not found
    //   .finally(() => setIsLoading(false));

    // Using mock data for this example:
    const foundProject = mockProjects.find((p) => p.id === projectId);
    setTimeout(() => {
      // Simulate network delay
      setProject(foundProject || null); // Set to null if not found
      setIsLoading(false);
    }, 300);
    // --- End simulation ---
  }, [projectId]);

  return <ProjectView project={project} isLoading={isLoading} />;
};

export default ProjectDetailPage;
