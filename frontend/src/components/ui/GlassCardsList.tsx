import { useEffect, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard.tsx';
import ToolCarousel from '@/components/ui/ToolCarousel.tsx';
import { LocationMap } from '@/components/ui/LocationMap.tsx';
import { ScrollableTimeline, TimelineData } from '@/components/ui/ScrollableTimeline';

const GlassCardsList = () => {
  const [experiences, setExperiences] = useState<TimelineData[]>([]);
  const [studies, setStudies] = useState<TimelineData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [experiencesResponse, studiesResponse] = await Promise.all([
          fetch('/api/experiences/all'),
          fetch('/api/studies/all')
        ]);

        if (!experiencesResponse.ok || !studiesResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const experiencesData = await experiencesResponse.json();
        const studiesData = await studiesResponse.json();

        setExperiences(experiencesData.experiences);
        setStudies(studiesData.studies);
      } catch (error) {
        console.error('Failed to fetch timeline data:', error);
      }
    };

    fetchData();
  }, []);

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