import { useEffect, useState, lazy, Suspense } from 'react';
import GlassCardHero from '@/components/ui/GlassCardHero.tsx';
import ToolCarousel from '@/components/ui/ToolCarousel.tsx';
import {
  ScrollableTimeline,
  type TimelineData,
} from '@/components/ui/ScrollableTimeline';
import WidgetTechnologyChip from '@/components/ui/WidgetTechnologyChip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { MessageCircle } from 'lucide-react';

// lazy load du map
const LocationMapLazy = lazy(() =>
  import('@/components/ui/LocationMap').then((m) => ({
    default: m.LocationMap,
  })),
);

const GlassCardsList = () => {
  const [experiences, setExperiences] = useState<TimelineData[]>([]);
  const [studies, setStudies] = useState<TimelineData[]>([]);
  const { openChat } = useChat();

  useEffect(() => {
    const ac = new AbortController();
    const fetchData = async () => {
      try {
        const [experiencesResponse, studiesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/experiences/all`, {
            signal: ac.signal,
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/studies/all`, {
            signal: ac.signal,
          }),
        ]);
        if (!experiencesResponse.ok || !studiesResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const experiencesData = await experiencesResponse.json();
        const studiesData = await studiesResponse.json();
        setExperiences(experiencesData.experiences);
        setStudies(studiesData.studies);
      } catch (error: unknown) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Failed to fetch timeline data:', error);
        }
      }
    };
    fetchData();
    return () => ac.abort();
  }, []);

  const topSkills = [
    'LLMs',
    'Python',
    'vLLM',
    'CUDA',
    'NVIDIA',
    'Docker',
    'TypeScript',
    'MongoDB',
    'Qdrant',
  ];

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[repeat(2,250px)] sm:grid-rows-[repeat(3,225px)] grid-rows-[repeat(3,200px)] lg:auto-rows-[250px] sm:auto-rows-[225px] auto-rows-[200px] gap-4 sm:gap-6 lg:gap-8 mb-10">
      <GlassCardHero title="Location" px={0} pt={0}>
        <Suspense
          fallback={
            <div className="w-full h-56 flex items-center justify-center">
              Loading map…
            </div>
          }
        >
          <LocationMapLazy />
        </Suspense>
      </GlassCardHero>

      <GlassCardHero title="My Favourite Tools" px={0} size="medium">
        <ToolCarousel />
      </GlassCardHero>

      <GlassCardHero title="Experiences" px={0} size="medium">
        <ScrollableTimeline
          data={experiences}
          showGradients={false}
          accentColor={'#FF6F61'}
          scrollSpeed={3}
        />
      </GlassCardHero>

      <GlassCardHero title="Studies" px={0}>
        <ScrollableTimeline
          data={studies}
          showGradients={false}
          accentColor={'#4A90E2'}
          scrollSpeed={3}
        />
      </GlassCardHero>

      <GlassCardHero title="Top Skills" px={1} size="small">
        <ScrollArea className="h-48 thin-scrollbar pr-1 w-full">
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 gap-2 pr-1 pb-14 sm:pb-10 md:pb-8 lg:pb-6 ">
            {topSkills.map((tech) => (
              <WidgetTechnologyChip key={tech} technology={tech} />
            ))}
          </div>
        </ScrollArea>
      </GlassCardHero>

      <GlassCardHero title="Ask about me" size="small">
        <div className="flex flex-col gap-5 sm:gap-6 pb-4 pr-1 h-full justify-between">
          <p className="text-sm sm:text-base opacity-85 leading-relaxed">
            Chat with my AI persona - ask about my resume, projects, and
            experience.
          </p>
          <Button
            onClick={openChat}
            aria-label="Start portfolio chat"
            size="lg"
            className="w-fit !rounded-full !bg-blue-600 !text-white hover:!bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-blue-500/30 hover:-rotate-3"
          >
            Start chat
            <MessageCircle className="size-4" />
          </Button>
        </div>
      </GlassCardHero>
    </div>
  );
};

export default GlassCardsList;
