import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider.tsx';
import SvgIcon from '@/components/ui/SvgIcon';
import { LOGOS } from '@/components/ui/logos';
import { Brain, Cpu } from 'lucide-react';

export interface WidgetTechnologyChipProps {
  technology: string;
  className?: string;
  size?: 'sm' | 'md';
}

type IconPair = { light: React.ReactNode; dark: React.ReactNode };

const ICON_SIZE = 18;

function getIconPair(tech: string): IconPair | null {
  const t = tech.toLowerCase();
  switch (t) {
    case 'llms':
    case 'llm':
      return {
        light: <Brain size={ICON_SIZE} />,
        dark: <Brain size={ICON_SIZE} />,
      };
    case 'vllm':
      return {
        light: <SvgIcon path={LOGOS.vllmColor} alt="vLLM" size={ICON_SIZE} />,
        dark: <SvgIcon path={LOGOS.vllmColor} alt="vLLM" size={ICON_SIZE} />,
      };
    case 'cuda':
    case 'nvidia':
      return {
        light: <SvgIcon path={LOGOS.nvidia} alt="NVIDIA" size={ICON_SIZE} />,
        dark: <SvgIcon path={LOGOS.nvidia} alt="NVIDIA" size={ICON_SIZE} />,
      };
    case 'hardware':
    case 'gpu':
      return {
        light: <Cpu size={ICON_SIZE} />,
        dark: <Cpu size={ICON_SIZE} />,
      };
    case 'mongodb':
      return {
        light: <SvgIcon path={LOGOS.mongodb} alt="MongoDB" size={ICON_SIZE} />,
        dark: <SvgIcon path={LOGOS.mongodb} alt="MongoDB" size={ICON_SIZE} />,
      };
    case 'qdrant':
      return {
        light: <SvgIcon path={LOGOS.qdrant} alt="Qdrant" size={ICON_SIZE} />,
        dark: <SvgIcon path={LOGOS.qdrant} alt="Qdrant" size={ICON_SIZE} />,
      };
    case 'typescript':
      return {
        light: (
          <SvgIcon path={LOGOS.typescript} alt="TypeScript" size={ICON_SIZE} />
        ),
        dark: (
          <SvgIcon path={LOGOS.typescript} alt="TypeScript" size={ICON_SIZE} />
        ),
      };
    case 'react':
      return {
        light: <SvgIcon path={LOGOS.react} alt="React" size={ICON_SIZE} />,
        dark: <SvgIcon path={LOGOS.react} alt="React" size={ICON_SIZE} />,
      };
    case 'python':
      return {
        light: <SvgIcon path={LOGOS.python} alt="Python" size={ICON_SIZE} />,
        dark: <SvgIcon path={LOGOS.python} alt="Python" size={ICON_SIZE} />,
      };
    case 'fastapi':
      return {
        light: <SvgIcon path={LOGOS.fastapi} alt="FastAPI" size={ICON_SIZE} />,
        dark: <SvgIcon path={LOGOS.fastapi} alt="FastAPI" size={ICON_SIZE} />,
      };
    case 'tailwind':
    case 'tailwindcss':
      return {
        light: (
          <SvgIcon path={LOGOS.tailwind} alt="TailwindCSS" size={ICON_SIZE} />
        ),
        dark: (
          <SvgIcon path={LOGOS.tailwind} alt="TailwindCSS" size={ICON_SIZE} />
        ),
      };
    case 'docker':
      return {
        light: <SvgIcon path={LOGOS.docker} alt="Docker" size={ICON_SIZE} />,
        dark: <SvgIcon path={LOGOS.docker} alt="Docker" size={ICON_SIZE} />,
      };
    default:
      return null;
  }
}

export const WidgetTechnologyChip: React.FC<WidgetTechnologyChipProps> = ({
  technology,
  className,
  size = 'md',
}) => {
  const { resolvedTheme } = useTheme();
  const pair = getIconPair(technology);
  const isDark = (resolvedTheme ?? 'light') === 'dark';

  const sizes =
    size === 'sm'
      ? {
          container: 'px-3 py-1.5',
          iconWrapper: 'w-6 h-6',
          label: 'text-xs',
        }
      : {
          container: 'px-3.5 py-2',
          iconWrapper: 'w-7 h-7',
          label: 'text-sm',
        };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn('relative', className)}
    >
      {/* Corps sans gradient: style verre subtil */}
      <div
        className={cn(
          'rounded-2xl flex items-center gap-2 backdrop-blur-xl',
          'border border-white/20 dark:border-white/10',
          'bg-white/20 dark:bg-slate-900/30',
          'shadow-sm hover:shadow-md transition-shadow',
          sizes.container,
        )}
      >
        <div
          className={cn(
            'rounded-full flex items-center justify-center',
            'border border-white/30 dark:border-white/10',
            'bg-white/60 dark:bg-slate-800/60',
            sizes.iconWrapper,
          )}
        >
          {pair ? (
            isDark ? (
              pair.dark
            ) : (
              pair.light
            )
          ) : (
            <span className="block w-3 h-3 rounded-full bg-slate-400" />
          )}
        </div>
        <span
          className={cn(
            sizes.label,
            'font-medium tracking-tight',
            'text-slate-800 dark:text-slate-100',
          )}
        >
          {technology}
        </span>
      </div>
    </motion.div>
  );
};

export default WidgetTechnologyChip;
