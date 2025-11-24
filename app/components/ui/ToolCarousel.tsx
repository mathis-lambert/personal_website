'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import SvgIcon from '@/components/ui/SvgIcon';
import { LOGOS } from '@/components/ui/logos';

const ICON_SIZE = 36;
const ITEM_WIDTH_HEIGHT = 'w-16 h-16';
const ITEM_SPACING = 'space-x-2';
const SCROLL_DURATION = 20;
const MOBILE_BREAKPOINT = 768;

// Chemins des logos détaillés (multicolores) dans public/svgs/logos
const logo = LOGOS;

type ToolItem = { name: string; icon: React.ReactNode };

const allTools: ToolItem[] = [
  {
    name: 'Python',
    icon: <SvgIcon path={logo.python} alt="Python" size={ICON_SIZE} />,
  },
  {
    name: 'FastAPI',
    icon: <SvgIcon path={logo.fastapi} alt="FastAPI" size={ICON_SIZE} />,
  },
  {
    name: 'Docker',
    icon: <SvgIcon path={logo.docker} alt="Docker" size={ICON_SIZE} />,
  },
  {
    name: 'PyCharm',
    icon: <SvgIcon path={logo.pycharm} alt="PyCharm" size={ICON_SIZE} />,
  },
  {
    name: 'React',
    icon: <SvgIcon path={logo.react} alt="React" size={ICON_SIZE} />,
  },
  {
    name: 'TypeScript',
    icon: <SvgIcon path={logo.typescript} alt="TypeScript" size={ICON_SIZE} />,
  },
  {
    name: 'Linux',
    icon: <SvgIcon path={logo.linux} alt="Linux" size={ICON_SIZE} />,
  },
  {
    name: 'Bash',
    icon: (
      <SvgIcon
        path={logo.bashLight}
        darkPath={logo.bashDark}
        alt="Bash"
        size={ICON_SIZE}
      />
    ),
  },
  {
    name: 'Tailwind',
    icon: <SvgIcon path={logo.tailwind} alt="Tailwind" size={ICON_SIZE} />,
  },
  {
    name: 'Mistral',
    icon: (
      <SvgIcon
        path={logo.mistralLight}
        darkPath={logo.mistralDark}
        alt="Mistral"
        size={ICON_SIZE}
      />
    ),
  },
  {
    name: 'OpenAI',
    icon: (
      <SvgIcon
        path={logo.openaiLight}
        darkPath={logo.openaiDark}
        alt="OpenAI"
        size={ICON_SIZE}
      />
    ),
  },
  {
    name: 'Github',
    icon: (
      <SvgIcon
        path={logo.githubLight}
        darkPath={logo.githubDark}
        alt="GitHub"
        size={ICON_SIZE}
      />
    ),
  },
  {
    name: 'GitLab',
    icon: <SvgIcon path={logo.gitlab} alt="GitLab" size={ICON_SIZE} />,
  },
  {
    name: 'Hugging Face',
    icon: (
      <SvgIcon path={logo.huggingface} alt="Hugging Face" size={ICON_SIZE} />
    ),
  },
  {
    name: 'Arc',
    icon: <SvgIcon path={logo.arc} alt="Arc" size={ICON_SIZE} />,
  },

  {
    name: 'Vite',
    icon: <SvgIcon path={logo.vite} alt="Vite" size={ICON_SIZE} />,
  },
  {
    name: 'vLLM',
    icon: <SvgIcon path={logo.vllmColor} alt="vLLM" size={ICON_SIZE} />,
  },
  {
    name: 'Qdrant',
    icon: <SvgIcon path={logo.qdrant} alt="Qdrant" size={ICON_SIZE} />,
  },
  {
    name: 'NVIDIA',
    icon: <SvgIcon path={logo.nvidia} alt="NVIDIA" size={ICON_SIZE} />,
  },
  {
    name: 'Shadcn',
    icon: (
      <SvgIcon
        path={logo.shadcnLight}
        darkPath={logo.shadcnDark}
        alt="shadcn/ui"
        size={ICON_SIZE}
      />
    ),
  },
  {
    name: 'Figma',
    icon: <SvgIcon path={logo.figma} alt="Figma" size={ICON_SIZE} />,
  },
];

const midPoint = Math.ceil(allTools.length / 2);
const topRowTools = allTools.slice(0, midPoint);
const bottomRowTools = allTools.slice(midPoint);

const ToolCarousel: React.FC<{ showToolNames?: boolean }> = ({
  showToolNames = false,
}) => {
  const controlsTop = useAnimation();
  const controlsBottom = useAnimation();
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  // Icônes gèrent elles-mêmes le thème via SvgIcon

  useEffect(() => {
    const checkScreenSize = () => {
      const mediaQuery = window.matchMedia(
        `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
      );
      setIsMobile(mediaQuery.matches);
    };
    checkScreenSize();
    const mediaQueryList = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );
    const handleResize = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);
    mediaQueryList.addEventListener('change', handleResize);
    return () => mediaQueryList.removeEventListener('change', handleResize);
  }, []);

  const startScrolling = useCallback(() => {
    if (shouldReduceMotion) return;
    controlsTop.start({
      x: '-50%',
      transition: {
        duration: SCROLL_DURATION,
        ease: 'linear',
        repeat: Infinity,
      },
    });
    controlsBottom.start({
      x: ['-50%', '0%'],
      transition: {
        duration: SCROLL_DURATION,
        ease: 'linear',
        repeat: Infinity,
      },
    });
  }, [shouldReduceMotion, controlsTop, controlsBottom]);

  const stopScrolling = useCallback(() => {
    if (isMobile || shouldReduceMotion) return;
    controlsTop.stop();
    controlsBottom.stop();
    controlsTop.start({
      x: '0%',
      transition: { duration: 0.6, type: 'spring', stiffness: 100 },
    });
    controlsBottom.start({
      x: '-50%',
      transition: { duration: 0.6, type: 'spring', stiffness: 100 },
    });
  }, [isMobile, shouldReduceMotion, controlsTop, controlsBottom]);

  useEffect(() => {
    if (isMobile && !shouldReduceMotion) {
      startScrolling();
    } else {
      controlsTop.stop();
      controlsBottom.stop();
      controlsTop.set({ x: '0%' });
      controlsBottom.set({ x: '-50%' });
    }
  }, [
    isMobile,
    shouldReduceMotion,
    controlsTop,
    controlsBottom,
    startScrolling,
  ]);

  const renderRow = (
    tools: typeof allTools,
    controls: typeof controlsTop,
    initialX: string = '0%',
  ) => (
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
              {tool.icon}
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
