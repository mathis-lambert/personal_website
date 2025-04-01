// src/components/GrainEffect.tsx
import React, { useMemo, useId } from 'react';

interface GrainEffectProps {
  size?: number;
  speed?: number;
  resolution?: number;
  className?: string;
}

const GrainEffect: React.FC<GrainEffectProps> = ({
                                                   size = 15,
                                                   speed = 3,
                                                   resolution = 50,
                                                   className = ''
                                                 }) => {
  const filterId = useId();
  const uniqueFilterId = `grain-filter-${filterId}`;

  const grainOpacity = useMemo(() => {
    const clampedSize = Math.max(1, Math.min(100, size));
    return (Math.pow(clampedSize / 100, 1.5) * 0.4) + 0.01;
  }, [size]);

  const baseFrequency = useMemo(() => {
    const clampedResolution = Math.max(1, Math.min(100, resolution));
    return (0.05 + (clampedResolution / 100) * 0.95).toFixed(3);
  }, [resolution]);

  // Durée de l'animation basée sur la vitesse
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
            80% { transform: translate(3%, 3%); }
            90% { transform: translate(-2%, 2%); }
        }
    `;

  const animationStyle = {
    animation: `grainSizzleInline ${animationDuration.toFixed(2)}s steps(5, end) infinite`
  };

  return (
    <div
      className={`fixed top-0 left-0 w-screen h-screen pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Style pour l'animation */}
      <style>{animationCSS}</style>

      {/* SVG Filter */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={uniqueFilterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves="5"
              stitchTiles="stitch"
            />
            <feComponentTransfer>
              <feFuncA
                type="gamma"
                amplitude="3"
                exponent="0.2"
                offset="0"
              />
            </feComponentTransfer>
            <feColorMatrix type="saturate" values="0.2" />
          </filter>
        </defs>
      </svg>

      {/* Grain Overlay avec animation inline */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] mix-blend-overlay pointer-events-none"
        style={{
          filter: `url(#${uniqueFilterId})`,
          opacity: grainOpacity,
          ...animationStyle
        }}
      />
    </div>
  );
};

export default GrainEffect;