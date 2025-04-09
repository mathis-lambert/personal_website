import GlassCard from '@/components/ui/GlassCard.tsx';
import ToolCarousel from '@/components/ui/ToolCarousel.tsx';

const GlassCardsList = () => {
  return (
    <div className="grid xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[repeat(2,300px)] sm:grid-rows-[repeat(3,250px)] grid-rows-[repeat(3,200px)] gap-4 sm:gap-6 lg:gap-12 mb-10">
      <GlassCard title="My Favourite Tools" px={0}>
        <ToolCarousel />
      </GlassCard>
      <GlassCard title="Expériences">
        <p>
          I'm a student in computer science and AI. I'm passionate about
          programming.
        </p>
      </GlassCard>
      <GlassCard title="Études">
        <p>
          I'm a student in computer science and AI. I'm passionate about
          programming.
        </p>
      </GlassCard>
      <GlassCard title="Localisation">
        <p>
          I'm a student in computer science and AI. I'm passionate about
          programming.
        </p>
      </GlassCard>
      <GlassCard title="Chatbot" size="medium">
        <p>
          I'm a student in computer science and AI. I'm passionate about
          programming.
        </p>
      </GlassCard>
    </div>
  );
};

export default GlassCardsList;
