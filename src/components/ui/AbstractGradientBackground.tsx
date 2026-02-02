"use client";
import React, { useMemo, useId } from "react";
import { createSeededRandom } from "@/lib/ui/seededRandom";
interface AbstractGradientBackgroundProps {
  className?: string;
  sphereColors?: string[];
  numSpheres?: number;
  minSphereRadius?: number;
  maxSphereRadiusFactor?: number;
  baseVelocity?: number;
  attractionStrength?: number;
  noiseIntensity?: number;
  dampingFactor?: number;
  blurIntensity?: string;
  opacityRange?: [number, number];
}

const MAX_SPHERES = 16;
const DEFAULT_COLORS = ["#9213C6", "#1B5FD9", "#29E6EA"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const softnessFromBlurClass = (blurIntensity?: string) => {
  if (!blurIntensity) return 0.7;
  const pxMatch = blurIntensity.match(/blur-\[(\d+)px\]/);
  if (pxMatch) {
    const px = clamp(Number(pxMatch[1]), 20, 220);
    const ratio = (px - 20) / 200;
    return clamp(0.55 + ratio * 0.3, 0.55, 0.85);
  }
  if (blurIntensity.includes("blur-3xl")) return 0.78;
  if (blurIntensity.includes("blur-2xl")) return 0.72;
  if (blurIntensity.includes("blur-xl")) return 0.66;
  if (blurIntensity.includes("blur-lg")) return 0.62;
  return 0.68;
};

const AbstractGradientBackground: React.FC<AbstractGradientBackgroundProps> = ({
  className = "",
  sphereColors = DEFAULT_COLORS,
  numSpheres = 6,
  minSphereRadius = 150,
  maxSphereRadiusFactor = 0.33,
  baseVelocity = 0.3,
  blurIntensity = "blur-3xl",
  opacityRange = [0.5, 1.0],
}) => {
  const instanceId = useId();
  const softness = useMemo(
    () => softnessFromBlurClass(blurIntensity),
    [blurIntensity],
  );
  const blurClassName = blurIntensity
    ? `${blurIntensity} brightness-125`
    : "blur-3xl brightness-125";

  const motionScale = clamp(baseVelocity * 3.2, 0.4, 1.4);
  const palette = sphereColors.length ? sphereColors : DEFAULT_COLORS;

  const spheres = useMemo(() => {
    const count = clamp(numSpheres, 1, MAX_SPHERES);
    const [opacityMin, opacityMax] = opacityRange;
    const innerStop = Math.round(18 + softness * 12);
    const midStop = Math.round(38 + softness * 14);
    const outerStop = Math.round(58 + softness * 22);

    // Seed is derived from instance + key props to keep the layout stable
    // while still feeling organic across different configurations.
    const seedPayload = [
      instanceId,
      count,
      opacityMin,
      opacityMax,
      minSphereRadius,
      maxSphereRadiusFactor,
      motionScale,
      softness,
      palette.join(","),
    ].join("|");
    const range = createSeededRandom(seedPayload);

    return Array.from({ length: count }).map((_, index) => {
      // Size/position/tempo are deterministic so React renders stay pure.
      const sizeFactor = range(0.35, 1.0);
      const size = `calc(${minSphereRadius}px + ${sizeFactor.toFixed(3)} * ${(
        maxSphereRadiusFactor * 100
      ).toFixed(2)}vmin)`;
      const opacity = clamp(range(opacityMin, opacityMax), 0.1, 1);

      const x1 = range(-10, 80);
      const y1 = range(-10, 80);
      const x2 = clamp(x1 + range(-25, 30), -15, 85);
      const y2 = clamp(y1 + range(-25, 30), -15, 85);

      const scale1 = range(0.9, 1.25);
      const scale2 = range(0.9, 1.3);

      const duration = range(36, 78) / motionScale;
      const delay = -range(0, duration);

      return {
        key: `sphere-${index}`,
        color: palette[index % palette.length],
        size,
        opacity,
        x1: `${x1.toFixed(2)}vw`,
        y1: `${y1.toFixed(2)}vh`,
        x2: `${x2.toFixed(2)}vw`,
        y2: `${y2.toFixed(2)}vh`,
        s1: scale1.toFixed(3),
        s2: scale2.toFixed(3),
        duration: `${duration.toFixed(2)}s`,
        delay: `${delay.toFixed(2)}s`,
        tier: index < 5 ? "primary" : "secondary",
        innerStop,
        midStop,
        outerStop,
      };
    });
  }, [
    instanceId,
    numSpheres,
    opacityRange,
    palette,
    minSphereRadius,
    maxSphereRadiusFactor,
    motionScale,
    softness,
  ]);

  return (
    <div
      className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}
    >
      <style>{`
        @keyframes abstract-drift {
          0% {
            transform: translate3d(var(--x1), var(--y1), 0) scale(var(--s1));
          }
          50% {
            transform: translate3d(var(--x2), var(--y2), 0) scale(var(--s2));
          }
          100% {
            transform: translate3d(var(--x1), var(--y1), 0) scale(var(--s1));
          }
        }
        .abstract-gradient-sphere {
          position: absolute;
          width: var(--size);
          height: var(--size);
          border-radius: 9999px;
          background: var(--gradient);
          opacity: var(--opacity);
          mix-blend-mode: screen;
          filter: saturate(1.1);
          will-change: transform;
          transform: translate3d(var(--x1), var(--y1), 0) scale(var(--s1));
          animation: abstract-drift var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }
        @media (max-width: 768px) {
          .abstract-gradient-sphere[data-tier="secondary"] {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .abstract-gradient-sphere {
            animation: none;
          }
        }
      `}</style>

      <div className="absolute inset-0 bg-background" />

      <div className={`absolute inset-0 ${blurClassName}`}>
        {spheres.map((sphere) => (
          <span
            key={sphere.key}
            data-tier={sphere.tier}
            className="abstract-gradient-sphere"
            style={
              {
                "--size": sphere.size,
                "--x1": sphere.x1,
                "--y1": sphere.y1,
                "--x2": sphere.x2,
                "--y2": sphere.y2,
                "--s1": sphere.s1,
                "--s2": sphere.s2,
                "--opacity": sphere.opacity,
                "--duration": sphere.duration,
                "--delay": sphere.delay,
                "--gradient": `radial-gradient(circle at 30% 30%, ${
                  sphere.color
                } 0%, ${sphere.color} ${sphere.innerStop}%, ${sphere.color} ${
                  sphere.midStop
                }%, transparent ${sphere.outerStop}%)`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
};

export default AbstractGradientBackground;
