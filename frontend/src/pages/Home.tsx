import GlassCard from '@/components/ui/GlassCard';

const Home = () => {
  return (
    <div className="min-h-screen p-8 bg-transparent">
      {/* Titres principaux */}
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold">
          Hi, I'm Mathis Lambert !
        </h1>
        <h1 className="text-4xl font-bold">
          <span className="opacity-70">I'm an</span> engineering student
        </h1>
        <h1 className="text-4xl font-bold">
          <span className="opacity-70">in</span>&nbsp;
          <span className="text-primary">AI</span>&nbsp;
          <span className="opacity-70">and</span>&nbsp;
          <span className="text-primary">Computer science</span>
        </h1>
      </div>

      {/* Grille des GlassCards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4">
        <GlassCard title="Assistant IA" pt={14}>
          <p>
            I'm a student in computer science and AI. I'm passionate about programming.
          </p>
        </GlassCard>
        <GlassCard title="Expériences" pt={14}>
          <p>
            I'm a student in computer science and AI. I'm passionate about programming.
          </p>
        </GlassCard>
        <GlassCard title="Études" pt={14}>
          <p>
            I'm a student in computer science and AI. I'm passionate about programming.
          </p>
        </GlassCard>
        <GlassCard title="Localisation" pt={14}>
          <p>
            I'm a student in computer science and AI. I'm passionate about programming.
          </p>
        </GlassCard>
        <GlassCard title="Chatbot" pt={14} size="medium">
          <p>
            I'm a student in computer science and AI. I'm passionate about programming.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default Home;
