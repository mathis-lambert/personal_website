import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useTheme } from '@/components/theme-provider.tsx';

import {
  Arc,
  BashDark,
  BashLight,
  Docker,
  FastAPI,
  Figma,
  GitHubDark,
  GitHubLight,
  GitLab,
  Linux,
  MistralAI,
  PyCharm,
  Python,
  ReactDark,
  ReactLight,
  ShadcnUiDark,
  ShadcnUiLight,
  TailwindCSS,
  TypeScript,
  Vite
} from '@ridemountainpig/svgl-react';

// --- Configuration ---
const ICON_SIZE = 36;
const ITEM_WIDTH_HEIGHT = 'w-16 h-16';
const ITEM_SPACING = 'space-x-2';
const SCROLL_DURATION = 20;
const MOBILE_BREAKPOINT = 768;
// --- End Configuration ---

const allTools = [
  {
    name: 'Python',
    icons: {
      light: <Python width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <Python width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'FastAPI',
    icons: {
      light: <FastAPI width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <FastAPI width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Docker',
    icons: {
      light: <Docker width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <Docker width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'PyCharm',
    icons: {
      light: <PyCharm width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <PyCharm width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'React',
    icons: {
      light: <ReactLight width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <ReactDark width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'TypeScript',
    icons: {
      light: <TypeScript width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <TypeScript width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Linux',
    icons: {
      light: <Linux width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <Linux width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Bash',
    icons: {
      light: <BashLight width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <BashDark width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Tailwind',
    icons: {
      light: <TailwindCSS width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <TailwindCSS width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Mistral',
    icons: {
      light: <MistralAI width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <MistralAI width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Github',
    icons: {
      light: <GitHubLight width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <GitHubDark width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'GitLab',
    icons: {
      light: <GitLab width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <GitLab width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Shadcn',
    icons: {
      light: <ShadcnUiLight width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <ShadcnUiDark width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Arc',
    icons: { light: <Arc width={ICON_SIZE} height={ICON_SIZE} />, dark: <Arc width={ICON_SIZE} height={ICON_SIZE} /> }
  },
  {
    name: 'Figma',
    icons: {
      light: <Figma width={ICON_SIZE} height={ICON_SIZE} />,
      dark: <Figma width={ICON_SIZE} height={ICON_SIZE} />
    }
  },
  {
    name: 'Vite',
    icons: { light: <Vite width={ICON_SIZE} height={ICON_SIZE} />, dark: <Vite width={ICON_SIZE} height={ICON_SIZE} /> }
  }
];

const midPoint = Math.ceil(allTools.length / 2);
const topRowTools = allTools.slice(0, midPoint);
const bottomRowTools = allTools.slice(midPoint);

const ToolCarousel: React.FC<{ showToolNames?: boolean }> = ({
                                                               showToolNames = false
                                                             }) => {
  const controlsTop = useAnimation();
  const controlsBottom = useAnimation();
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const { resolvedTheme } = useTheme();
  // Assurez-vous d'avoir une valeur par défaut si le thème n'est pas immédiatement disponible
  const currentTheme = resolvedTheme || 'light';

  useEffect(() => {
    const checkScreenSize = () => {
      const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      setIsMobile(mediaQuery.matches);
    };
    checkScreenSize();
    const mediaQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleResize = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQueryList.addEventListener('change', handleResize);
    return () => mediaQueryList.removeEventListener('change', handleResize);
  }, []);

  const startScrolling = () => {
    if (shouldReduceMotion) return;
    controlsTop.start({
      x: '-50%',
      transition: { duration: SCROLL_DURATION, ease: 'linear', repeat: Infinity }
    });
    controlsBottom.start({
      x: ['-50%', '0%'],
      transition: { duration: SCROLL_DURATION, ease: 'linear', repeat: Infinity }
    });
  };

  const stopScrolling = () => {
    if (isMobile || shouldReduceMotion) return;
    controlsTop.stop();
    controlsBottom.stop();
    controlsTop.start({ x: '0%', transition: { duration: 0.6, type: 'spring', stiffness: 100 } });
    controlsBottom.start({ x: '-50%', transition: { duration: 0.6, type: 'spring', stiffness: 100 } });
  };

  useEffect(() => {
    if (isMobile && !shouldReduceMotion) {
      startScrolling();
    } else {
      controlsTop.stop();
      controlsBottom.stop();
      controlsTop.set({ x: '0%' });
      controlsBottom.set({ x: '-50%' });
    }
  }, [isMobile, shouldReduceMotion, controlsTop, controlsBottom]);

  const renderRow = (tools: typeof allTools, controls: typeof controlsTop, initialX: string = '0%') => (
    <div className="relative w-full overflow-hidden min-h-[4rem]">
      <motion.div
        className={`absolute left-0 top-0 flex flex-nowrap ${ITEM_SPACING}`}
        initial={{ x: initialX }}
        animate={controls}
      >
        {[...tools, ...tools].map((tool, index) => (
          <div
            key={`${tool.name}-${index}`}
            className={`flex-shrink-0 flex flex-col items-center justify-center rounded-lg ${ITEM_WIDTH_HEIGHT}`}
          >
            <div className="flex-grow flex items-center justify-center">
              {currentTheme === 'dark' ? tool.icons.dark : tool.icons.light}
            </div>
            {showToolNames && (
              <div className="text-xs text-center mt-1 text-gray-700/40 dark:text-gray-200/40">
                {tool.name}
              </div>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );

  return (
    <div
      className="flex flex-col justify-start gap-0 sm:gap-4 lg:gap-8 lg:mt-2 min-w-full w-full h-full overflow-hidden cursor-pointer"
      onMouseEnter={isMobile ? undefined : startScrolling}
      onMouseLeave={isMobile ? undefined : stopScrolling}
    >
      <div className="flex w-full">
        {renderRow(topRowTools, controlsTop, '0%')}
      </div>
      <div className="flex w-full">
        {renderRow(bottomRowTools, controlsBottom, '-50%')}
      </div>
    </div>
  );
};

export default ToolCarousel;