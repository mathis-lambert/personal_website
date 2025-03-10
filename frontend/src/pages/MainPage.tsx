import { Flex, Grid, Heading } from '@chakra-ui/react';
import '../style/MainPage.scss';
import GlassCard from '@/components/GlassCard/GlassCard.tsx';

const MainPage = () => {


  return (
    <div className={'main-page'}>
      <div className="heading-titles">
        <Heading as="h1">Hi, I'm Mathis Lambert !</Heading>
        <Heading as="h1"><span className="translucent">I'm an</span> engineering student</Heading>
        <Heading as="h1">
          <span className="translucent">in</span>&nbsp;
          <span className="highlight">AI</span>&nbsp;
          <span className="translucent">and</span>&nbsp;
          <span className="highlight">Computer science</span>
        </Heading>
      </div>

      <Grid
        templateColumns={['repeat(2, 1fr)', 'repeat(2, 1fr)', 'repeat(3, 1fr)']}
        gridAutoRows="1fr"
        className="glass-card-container"
      >
        <GlassCard title={'Assistant IA'} pt={14}>
          <p>
            I'm a student in computer science and AI. I'm passionate about
            programming.
          </p>
        </GlassCard>
        <GlassCard title={'Expériences'} pt={14}>
          <p>
            I'm a student in computer science and AI. I'm passionate about
            programming.
          </p>
        </GlassCard>
        <GlassCard title={'Études'} pt={14}>
          <p>
            I'm a student in computer science and AI. I'm passionate about
            programming.
          </p>
        </GlassCard>
        <GlassCard title={'Localisation'} pt={14}>
          <p>
            I'm a student in computer science and AI. I'm passionate about
            programming.
          </p>
        </GlassCard>
        <GlassCard title={'Chatbot'} pt={14} size={'medium'}>
          <p>
            I'm a student in computer science and AI. I'm passionate about
            programming.
          </p>
        </GlassCard>

      </Grid>

    </div>
  );
};

export default MainPage;