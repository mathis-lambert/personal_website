'use client';
// src/components/GrainEffect.tsx
import React, { useMemo, useId } from 'react';
import { useTheme } from '@/components/theme-provider';

interface GrainEffectProps {
  size?: number;
  speed?: number;
  resolution?: number;
  darkOpacityMultiplier?: number; // Contrôle l'augmentation de l'opacité en mode sombre
  className?: string;
}

const GrainEffect: React.FC<GrainEffectProps> = ({
  size = 15,
  speed = 3,
  resolution = 50,
  darkOpacityMultiplier = 0.5, // Valeur par défaut pour le multiplicateur d'opacité
  className = '',
}) => {
  const filterId = useId();
  const uniqueFilterId = `grain-filter-${filterId}`;
  const { resolvedTheme } = useTheme(); // Récupère le thème résolu (light/dark)

  const grainOpacity = useMemo(() => {
    const clampedSize = Math.max(1, Math.min(100, size));
    // Calcul de l'opacité de base
    const baseOpacity = Math.pow(clampedSize / 100, 1.5) * 0.4 + 0.01;

    // Appliquer le multiplicateur si le thème est sombre
    const finalOpacity =
      resolvedTheme === 'dark'
        ? baseOpacity * darkOpacityMultiplier
        : baseOpacity;

    // S'assurer que l'opacité reste dans l'intervalle [0, 1]
    return Math.max(0, Math.min(1, finalOpacity));
  }, [size, resolvedTheme, darkOpacityMultiplier]); // Ajout des dépendances

  const baseFrequency = useMemo(() => {
    const clampedResolution = Math.max(1, Math.min(100, resolution));
    return (0.05 + (clampedResolution / 100) * 0.95).toFixed(3);
  }, [resolution]);

  const animationDuration = useMemo(() => {
    const clampedSpeed = Math.max(1, Math.min(10, speed));
    return (1 / clampedSpeed) * 2;
  }, [speed]);

  const animationCSS = `
        @keyframes grainSizzleInline {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-2%, -2%); }
            20% { transform: translate(2%, 2%); }
            30% { transform: translate(-3%, 1%); }
            40% { transform: translate(3%, -1%); }
            50% { transform: translate(-1%, 3%); }
            60% { transform: translate(1%, -3%); }
            70% { transform: translate(-3%, -3%); }
            80% { translate(3%, 3%); }
            90% { transform: translate(-2%, 2%); }
        }
    `;

  const animationStyle = {
    animation: `grainSizzleInline ${animationDuration.toFixed(2)}s steps(5, end) infinite`,
  };

  return (
    <div
      className={`fixed inset-0 w-screen h-screen pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <style>{animationCSS}</style>
      <svg
        className="absolute w-0 h-0 overflow-hidden"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={uniqueFilterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves="5"
              stitchTiles="stitch"
            />
            <feComponentTransfer>
              <feFuncA type="gamma" amplitude="3" exponent="0.2" offset="0" />
            </feComponentTransfer>
            <feColorMatrix type="saturate" values="0.2" />
            <feBlend
              in="SourceGraphic"
              in2="turbulence"
              mode="multiply"
              result="blend"
            />
          </filter>
        </defs>
      </svg>
      <div
        // Utilisation de inset pour le positionnement
        className="absolute inset-[-10%] mix-blend-overlay pointer-events-none"
        style={{
          filter: `url(#${uniqueFilterId})`,
          opacity: grainOpacity,
          ...animationStyle,
        }}
      />
    </div>
  );
};

export default GrainEffect;
