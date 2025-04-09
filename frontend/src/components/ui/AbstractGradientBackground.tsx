import React, { useEffect, useRef, useCallback } from 'react';
import '@/style/AbstractGradientBackground.css';
import GrainEffect from '@/components/ui/GrainEffect.tsx';
import * as culori from 'culori';

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  opacity: number;
  targetX: number;
  targetY: number;
}

interface TargetArea {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

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
  grainSize?: number;
  grainSpeed?: number;
  grainResolution?: number;
}

const AbstractGradientBackground: React.FC<AbstractGradientBackgroundProps> = ({
  className,
  sphereColors = ['#9213C6', '#1B5FD9', '#29E6EA'],
  numSpheres = 6,
  minSphereRadius = 150,
  maxSphereRadiusFactor = 0.33,
  baseVelocity = 0.3,
  attractionStrength = 0.000015,
  noiseIntensity = 0.05,
  dampingFactor = 0.99,
  blurIntensity = 'blur-3xl',
  opacityRange = [0.5, 1.0],
  grainSize = 70,
  grainSpeed = 0.1,
  grainResolution = 65,
}) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blurCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const targetAreasRef = useRef<TargetArea[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const contextsRef = useRef<{
    main: CanvasRenderingContext2D | null;
    blur: CanvasRenderingContext2D | null;
  }>({ main: null, blur: null });

  const lightModeColor = useRef('oklch(97.5% 0.01 0)');
  const darkModeColor = useRef('oklch(20% 0.01 0)');
  const backgroundColorRef = useRef<string>(lightModeColor.current);

  const toRgbString = useCallback((color: string): string => {
    try {
      const rgb = culori.rgb(culori.parse(color));
      if (!rgb) return 'rgb(243, 244, 246)';
      return `rgb(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)})`;
    } catch (e) {
      console.error('Color conversion error:', e);
      return 'rgb(243, 244, 246)';
    }
  }, []);

  useEffect(() => {
    const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateBackground = () => {
      backgroundColorRef.current = darkMediaQuery.matches
        ? darkModeColor.current
        : lightModeColor.current;
    };

    updateBackground();
    darkMediaQuery.addEventListener('change', updateBackground);

    return () => darkMediaQuery.removeEventListener('change', updateBackground);
  }, [toRgbString]);

  useEffect(() => {
    if (!parentRef.current) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const parent = mutation.target as HTMLElement;
          const isDarkMode = parent.classList.contains('dark');

          backgroundColorRef.current = isDarkMode
            ? darkModeColor.current
            : lightModeColor.current;
        }
      });
    });

    observer.observe(parentRef.current, { attributes: true });

    return () => observer.disconnect();
  }, []);

  const updateTargetAreas = useCallback((width: number, height: number) => {
    const targetSize = Math.min(width, height) * 0.1;
    targetAreasRef.current = [
      { xMin: 0, xMax: targetSize, yMin: height - targetSize, yMax: height },
      {
        xMin: width - targetSize,
        xMax: width,
        yMin: height - targetSize,
        yMax: height,
      },
      {
        xMin: width / 2 - targetSize / 2,
        xMax: width / 2 + targetSize / 2,
        yMin: height - targetSize,
        yMax: height,
      },
      {
        xMin: width - targetSize,
        xMax: width,
        yMin: height / 2 - targetSize / 2,
        yMax: height / 2 + targetSize / 2,
      },
    ];
  }, []);

  const getRandomTarget = useCallback(() => {
    const areas = targetAreasRef.current;
    if (areas.length === 0)
      return {
        x: dimensionsRef.current.width / 2,
        y: dimensionsRef.current.height / 2,
      }; // Fallback
    const area = areas[Math.floor(Math.random() * areas.length)];
    const x = Math.random() * (area.xMax - area.xMin) + area.xMin;
    const y = Math.random() * (area.yMax - area.yMin) + area.yMin;
    return { x, y };
  }, []);

  const initializePoints = useCallback(() => {
    const { width, height } = dimensionsRef.current;
    if (width === 0 || height === 0) return; // Ensure dimensions are set

    const r_min = minSphereRadius;
    const r_max = Math.min(width, height) * maxSphereRadiusFactor;
    const [opacityMin, opacityMax] = opacityRange;

    // Make sure target areas are defined before initializing points
    if (targetAreasRef.current.length === 0) {
      updateTargetAreas(width, height);
    }

    pointsRef.current = Array.from({ length: numSpheres }, () => {
      const r = Math.random() * (r_max - r_min) + r_min;
      const { x: initialX, y: initialY } = getRandomTarget(); // Spawn point from a target area
      const { x: targetX, y: targetY } = getRandomTarget(); // First destination target
      return {
        x: initialX,
        y: initialY,
        vx: Math.random() * (baseVelocity * 2) - baseVelocity,
        vy: Math.random() * (baseVelocity * 2) - baseVelocity,
        r,
        color: sphereColors[Math.floor(Math.random() * sphereColors.length)],
        opacity: Math.random() * (opacityMax - opacityMin) + opacityMin,
        targetX,
        targetY,
      };
    });
  }, [
    numSpheres,
    minSphereRadius,
    maxSphereRadiusFactor,
    opacityRange,
    sphereColors,
    baseVelocity,
    getRandomTarget,
    updateTargetAreas,
  ]);

  const getColorWithOpacity = useCallback(
    (hexColor: string, opacity: number): string => {
      try {
        const rgb = culori.rgb(culori.parse(hexColor));
        if (!rgb) return `rgba(0, 0, 0, ${opacity})`;
        return `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, ${opacity})`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        const r = parseInt(hexColor.substring(1, 3), 16);
        const g = parseInt(hexColor.substring(3, 5), 16);
        const b = parseInt(hexColor.substring(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    },
    [],
  );

  const drawGradient = useCallback(() => {
    const { main: ctx, blur: blurCtx } = contextsRef.current;
    const { width, height } = dimensionsRef.current;

    if (!ctx || !blurCtx || width === 0 || height === 0) {
      animationFrameId.current = requestAnimationFrame(drawGradient);
      return;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = toRgbString(backgroundColorRef.current);
    ctx.fillRect(0, 0, width, height);

    pointsRef.current.forEach((point) => {
      const gradient = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        point.r,
      );
      gradient.addColorStop(0, getColorWithOpacity(point.color, point.opacity));
      gradient.addColorStop(
        0.7,
        getColorWithOpacity(point.color, point.opacity * 0.5),
      );
      gradient.addColorStop(1, getColorWithOpacity(point.color, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fill();

      const dx = point.targetX - point.x;
      const dy = point.targetY - point.y;
      point.vx += attractionStrength * dx;
      point.vy += attractionStrength * dy;

      point.vx += Math.random() * (noiseIntensity * 2) - noiseIntensity;
      point.vy += Math.random() * (noiseIntensity * 2) - noiseIntensity;

      point.vx *= dampingFactor;
      point.vy *= dampingFactor;

      point.x += point.vx;
      point.y += point.vy;

      const distanceSquared =
        (point.x - point.targetX) ** 2 + (point.y - point.targetY) ** 2;
      if (distanceSquared < (point.r / 4) ** 2) {
        const { x: newTargetX, y: newTargetY } = getRandomTarget();
        point.targetX = newTargetX;
        point.targetY = newTargetY;
      }
    });

    blurCtx.globalAlpha = 0.45;
    blurCtx.drawImage(ctx.canvas, 0, 0);

    animationFrameId.current = requestAnimationFrame(drawGradient);
  }, [
    attractionStrength,
    noiseIntensity,
    dampingFactor,
    getRandomTarget,
    toRgbString,
    getColorWithOpacity,
  ]);

  useEffect(() => {
    const parent = parentRef.current;
    const canvas = canvasRef.current;
    const blurCanvas = blurCanvasRef.current;
    let isMounted = true;

    if (!parent || !canvas || !blurCanvas) return;

    const isDarkMode =
      document.documentElement.classList.contains('dark') ||
      parent.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    backgroundColorRef.current = isDarkMode
      ? darkModeColor.current
      : lightModeColor.current;

    contextsRef.current.main = canvas.getContext('2d');
    contextsRef.current.blur = blurCanvas.getContext('2d');

    const { main: ctx, blur: blurCtx } = contextsRef.current;
    if (!ctx || !blurCtx) return;

    const setupCanvas = () => {
      const newWidth = parent.clientWidth;
      const newHeight = parent.clientHeight;
      dimensionsRef.current = { width: newWidth, height: newHeight };

      canvas.width = blurCanvas.width = newWidth;
      canvas.height = blurCanvas.height = newHeight;

      updateTargetAreas(newWidth, newHeight);
      initializePoints();

      blurCtx.fillStyle = toRgbString(backgroundColorRef.current);
      blurCtx.fillRect(0, 0, newWidth, newHeight);
    };

    const handleResize = () => {
      if (!isMounted) return;
      setupCanvas();
    };

    setupCanvas();
    window.addEventListener('resize', handleResize);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(drawGradient);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [
    className,
    sphereColors,
    numSpheres,
    minSphereRadius,
    maxSphereRadiusFactor,
    baseVelocity,
    attractionStrength,
    noiseIntensity,
    dampingFactor,
    opacityRange,
    initializePoints,
    updateTargetAreas,
    drawGradient,
    toRgbString,
  ]);

  return (
    <div
      ref={parentRef}
      className={`w-full h-full overflow-hidden fixed ${className} -z-10`}
    >
      <canvas ref={canvasRef} className="hidden" />
      <canvas
        ref={blurCanvasRef}
        className={`absolute top-0 left-0 w-full h-full ${blurIntensity} brightness-125`}
      />
      <GrainEffect
        size={grainSize}
        speed={grainSpeed}
        resolution={grainResolution}
      />
    </div>
  );
};

export default AbstractGradientBackground;
