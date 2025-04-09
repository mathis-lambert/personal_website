import React from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import {
  FaPython,
  FaDocker,
  FaReact,
  FaNodeJs,
  FaGitAlt,
  FaAws,
} from 'react-icons/fa';
import {
  SiPycharm,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiPostgresql,
  SiNextdotjs,
  SiNestjs,
} from 'react-icons/si';
import { AiOutlineApi } from 'react-icons/ai';

// --- Configuration ---
const ICON_SIZE = 32;
const ITEM_WIDTH_HEIGHT = 'w-16 h-16 lg:w-22 lg:h-22';
const ITEM_SPACING = 'space-x-2';
const SCROLL_DURATION = 30;
// --- End Configuration ---

// Define your tools with icons (using updated ICON_SIZE)
const allTools = [
  {
    name: 'Python',
    icon: <FaPython size={ICON_SIZE} className="text-blue-500" />,
  },
  {
    name: 'Docker',
    icon: <FaDocker size={ICON_SIZE} className="text-blue-600" />,
  },
  {
    name: 'PyCharm',
    icon: <SiPycharm size={ICON_SIZE} className="text-green-500" />,
  },
  {
    name: 'React',
    icon: <FaReact size={ICON_SIZE} className="text-cyan-400" />,
  },
  {
    name: 'TypeScript',
    icon: <SiTypescript size={ICON_SIZE} className="text-blue-700" />,
  },
  {
    name: 'Next.js',
    icon: (
      <SiNextdotjs size={ICON_SIZE} className="text-black dark:text-white" />
    ),
  },
  {
    name: 'Node.js',
    icon: <FaNodeJs size={ICON_SIZE} className="text-green-600" />,
  },
  {
    name: 'TailwindCSS',
    icon: <SiTailwindcss size={ICON_SIZE} className="text-teal-500" />,
  },
  {
    name: 'Git',
    icon: <FaGitAlt size={ICON_SIZE} className="text-orange-600" />,
  },
  {
    name: 'PostgreSQL',
    icon: <SiPostgresql size={ICON_SIZE} className="text-blue-800" />,
  },
  { name: 'AWS', icon: <FaAws size={ICON_SIZE} className="text-orange-500" /> },
  {
    name: 'Vercel',
    icon: <SiVercel size={ICON_SIZE} className="text-black dark:text-white" />,
  },
  {
    name: 'NestJS',
    icon: <SiNestjs size={ICON_SIZE} className="text-red-600" />,
  },
  {
    name: 'Mistral',
    icon: <AiOutlineApi size={ICON_SIZE} className="text-purple-500" />,
  },
];

const midPoint = Math.ceil(allTools.length / 2);
const topRowTools = allTools.slice(0, midPoint);
const bottomRowTools = allTools.slice(midPoint);

const ToolCarousel: React.FC = () => {
  const controlsTop = useAnimation();
  const controlsBottom = useAnimation();
  const shouldReduceMotion = useReducedMotion();

  const startScrolling = () => {
    if (shouldReduceMotion) return;

    controlsTop.start({
      x: '-50%',
      transition: {
        duration: SCROLL_DURATION,
        ease: 'linear',
        repeat: Infinity,
      },
    });
    // Bottom row starts from -50% and goes to 0% to simulate reverse direction
    controlsBottom.start({
      x: ['-50%', '0%'],
      transition: {
        duration: SCROLL_DURATION,
        ease: 'linear',
        repeat: Infinity,
      },
    });
  };

  const stopScrolling = () => {
    controlsTop.start({
      x: '0%',
      transition: { duration: 0.8, ease: 'easeOut' },
    });
    controlsBottom.start({
      x: '-50%',
      transition: { duration: 0.8, ease: 'easeOut' },
    });
  };

  const renderRow = (tools: typeof allTools, controls: typeof controlsTop) => (
    <div className="relative w-full overflow-hidden min-h-[7rem]">
      <motion.div
        className={`absolute left-0 inline-flex ${ITEM_SPACING} whitespace-nowrap`}
        animate={controls}
        initial={{ x: '0%' }}
      >
        {[...tools, ...tools].map((tool, index) => (
          <div
            key={`${tool.name}-${index}`}
            className={`flex flex-col items-center justify-center rounded-lg ${ITEM_WIDTH_HEIGHT} p-2`}
          >
            <div className="flex-grow flex items-center justify-center">
              {tool.icon}
            </div>
            <span className="mt-1 text-xs font-medium text-center text-gray-800 dark:text-gray-200">
              {tool.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );

  return (
    <div
      className="flex flex-col min-w-full w-full h-full overflow-hidden cursor-pointer"
      onMouseEnter={startScrolling}
      onMouseLeave={stopScrolling}
    >
      {/* Top Row - Ensure enough height for items */}
      <div className="flex w-full overflow-hidden min-h-[4rem]  lg:min-h-[7rem]">
        {renderRow(topRowTools, controlsTop)}
      </div>
      {/* Bottom Row - Ensure enough height for items */}
      <div className="flex w-full overflow-hidden min-h-[4rem] lg:min-h-[7rem]">
        {renderRow(bottomRowTools, controlsBottom)}
      </div>
    </div>
  );
};

export default ToolCarousel;
