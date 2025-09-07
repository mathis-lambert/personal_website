import ProjectsList from '@/components/projects/ProjectsList.tsx';

const ProjectsPage = () => {
  return (
    <>
      <title>Projects - Mathis LAMBERT</title>
      <meta name="description" content="Projects of Mathis LAMBERT" />
      <link rel="canonical" href="/projects" />
      <meta property="og:title" content="Projects - Mathis LAMBERT" />
      <meta property="og:description" content="Projects of Mathis LAMBERT" />
      <meta property="og:url" content="/projects" />
      <meta property="og:type" content="website" />
      <ProjectsList />
    </>
  );
};

export default ProjectsPage;
