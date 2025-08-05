import GlassCard from '@/components/ui/GlassCard.tsx';
import ToolCarousel from '@/components/ui/ToolCarousel.tsx';
import { LocationMap } from '@/components/ui/LocationMap.tsx';
import { ScrollableTimeline, TimelineData } from '@/components/ui/ScrollableTimeline';

const experiences: TimelineData[] = [
  {
    title: 'R&D Engineer Apprentice – AI Research Team',
    company: 'Free Pro',
    date: 'Sept. 2024 - Present',
    description:
      'Working on Transformer models (LLMs, time series): dataset design, fine-tuning (SFT, DPO, LoRA), and evaluation. Deploying AI workloads on HPC infrastructures with Nvidia H100 GPUs, using Docker, Slurm, and Nvidia NGC. Monitoring open-source models (Mistral, LLaMA), exploring enterprise-focused AI Agents, embeddings, Speech2Text, and Doc2Vec.'
  },
  {
    title: 'AI R&D Developer – AI Research Team',
    company: 'Free Pro',
    date: 'Sept. 2023 - Sept. 2024',
    description:
      'Active contribution to R&D projects in generative AI and HPC optimization. Experience in Computer Vision (OCR, DepthAI, YOLOv8), telecom (5G SA, GNodeB), and training open-source models on GPU clusters. Proficient in infrastructure workflows and associated tools.'
  },
  {
    title: 'Junior R&D Developer',
    company: 'Free Pro',
    date: 'June 2023 - Sept. 2023',
    description:
      'Implemented AI prototypes for internal business use cases. Conducted exploratory work in text generation, speech synthesis, and vector representations (embeddings).'
  },
  {
    title: 'Web Developer & Web Designer',
    company: 'LEXTAN',
    date: 'June 2022 - Aug. 2022',
    description:
      'Complete redesign of the company website: UI/UX, development from scratch, and responsive integration. Delivered custom web solutions for Vivatech and JDL Expo.'
  },
  {
    title: '3D Designer – CES Scenography',
    company: 'LEXTAN',
    date: 'Jan. 2021',
    description:
      'Created photorealistic 3D content and video animations for the Autopod project showcased at CES 2020. Collaborated on scenography and motion design to enhance booth visual impact.'
  },
  {
    title: 'Video Game Developer',
    company: 'ISART DIGITAL Paris',
    date: 'June 2018 - July 2018',
    description:
      'Two-week game development internship using Unity. Designed and developed a complete game, including gameplay mechanics and visual integration. Strengthened skills in logic, creativity, and software development.'
  },
  {
    title: 'Co-founder – IZZY Project (Student Startup)',
    company: 'PÉPITE Provence',
    date: 'March 2018 - April 2018',
    description:
      '2nd Prize – Jury Award at the Start’up Competition in Chicago. Developed an intelligent fatigue detection system for long-haul truck drivers, aligned with the UN Sustainable Development Goals.'
  }
];

const studies: TimelineData[] = [
  {
    title: 'Engineering - Computer Science – CPE Lyon',
    company: 'CPE Lyon',
    date: 'Sept. 2024 - Present',
    description:
      'Engineering degree in computer science with a major in Machine Learning and Artificial Intelligence. Courses focused on language models, performance optimization, and industrial AI applications.'
  },
  {
    title: 'Bachelor MMi – Computer Science Specialization',
    company: 'IUT MMI - Toulon (83)',
    date: 'Sept. 2021 - Aug. 2024',
    description:
      'Multidisciplinary program in multimedia and computer science, with a specialization in web and mobile development. Hands-on projects in design, development, and digital project management.'
  }
];

const GlassCardsList = () => {
  return (
    <div
      className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[repeat(2,250px)] sm:grid-rows-[repeat(3,225px)] grid-rows-[repeat(3,200px)] gap-4 sm:gap-6 lg:gap-8 mb-10">
      <GlassCard title="My Favourite Tools" px={0}>
        <ToolCarousel />
      </GlassCard>
      <GlassCard title="Experiences" px={0}>
        <ScrollableTimeline
          data={experiences}
          showGradients={false}
          accentColor={'#FF6F61'}
        />
      </GlassCard>
      <GlassCard title="Studies">
        <ScrollableTimeline
          data={studies}
          showGradients={false}
          accentColor={'#4A90E2'}
        />
      </GlassCard>
      <GlassCard title="Location" px={0} pt={0}>
        <LocationMap />
      </GlassCard>
      <GlassCard title="Chatbot" size="medium">
        <p>🚧 Work in progress...</p>
      </GlassCard>
    </div>
  );
};

export default GlassCardsList;
