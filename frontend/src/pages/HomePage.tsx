import GlowingText from '@/components/ui/GlowingText.tsx';
import { Heading1 } from '@/components/ui/Headings.tsx';
import GlassCardsList from '@/components/ui/GlassCardsList.tsx';
import { Badge } from '@/components/ui/Badge.tsx';

const HomePage = () => {
  return (
    <div className="">
      {/* Titres principaux */}
      <div className="mt-52 mb-24 space-y-4">
        <Heading1 delay={0.1}>Hi, I'm Mathis Lambert !</Heading1>
        <Heading1 delay={0.2}>
          <span className="opacity-20">I'm an</span> engineering student
        </Heading1>
        <Heading1 delay={0.3}>
          <span className="opacity-20">in</span>&nbsp;
          <GlowingText color={'text-sky-500'}>AI</GlowingText>&nbsp;
          <span className="opacity-20">and</span>&nbsp;
          <GlowingText color={'text-sky-500'}>Computer science</GlowingText>
        </Heading1>
        <div className={'flex items-center gap-2 mt-4'}>
          <Badge
            content={'Working at Free Pro'}
            colorScheme={'green'}
            delay={0}
          />
          <Badge
            content={'Studying at CPE Lyon'}
            colorScheme={'blue'}
            delay={0.25}
          />
        </div>
      </div>

      {/* Cartes */}
      <GlassCardsList />
    </div>
  );
};

export default HomePage;
