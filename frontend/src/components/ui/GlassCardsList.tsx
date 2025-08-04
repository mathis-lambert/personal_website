import GlassCard from '@/components/ui/GlassCard.tsx';
import ToolCarousel from '@/components/ui/ToolCarousel.tsx';
import { LocationMap } from '@/components/ui/LocationMap.tsx';
import { ExperienceTimeline } from '@/components/ui/ExperienceTImeline.tsx';

const GlassCardsList = () => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[repeat(2,250px)] sm:grid-rows-[repeat(3,225px)] grid-rows-[repeat(3,200px)] gap-4 sm:gap-6 lg:gap-8 mb-10">
      <GlassCard title="My Favourite Tools" px={0}>
        <ToolCarousel />
      </GlassCard>
      <GlassCard title="Expériences" px={0}>
        <ExperienceTimeline />
      </GlassCard>
      <GlassCard title="Études">
        <p>🚧 Work in progress...</p>
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
