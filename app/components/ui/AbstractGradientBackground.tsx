'use client';
import React, { useEffect, useRef } from 'react';
import GrainEffect from '@/components/ui/GrainEffect';
import * as culori from 'culori';

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

const MAX_SPHERES = 16;

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  const int MAX_SPHERES = ${MAX_SPHERES};

  uniform int u_count;
  uniform vec2 u_resolution;
  uniform vec2 u_positions[MAX_SPHERES];
  uniform float u_radius[MAX_SPHERES];
  uniform float u_alpha[MAX_SPHERES];
  uniform vec3 u_colors[MAX_SPHERES];
  uniform vec3 u_background;

  varying vec2 v_uv;

  float ease(float x) {
    return x * x * (3.0 - 2.0 * x);
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec3 color = u_background;

    for (int i = 0; i < MAX_SPHERES; i++) {
      if (i >= u_count) break;
      float dist = distance(fragCoord, u_positions[i]);
      float influence = ease(clamp(1.0 - dist / u_radius[i], 0.0, 1.0));
      float weight = clamp(u_alpha[i] * influence, 0.0, 1.0);
      color = mix(color, u_colors[i], weight);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

const createShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to create shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'Unknown shader error';
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
};

const createProgram = (
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string,
): WebGLProgram => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);

  const program = gl.createProgram();
  if (!program) {
    throw new Error('Unable to create shader program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'Unknown link error';
    gl.deleteProgram(program);
    throw new Error(info);
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

const colorToVec3 = (value: string, fallback: [number, number, number]) => {
  try {
    const parsed = culori.rgb(culori.parse(value));
    if (!parsed) return fallback;
    return [
      Math.min(1, Math.max(0, parsed.r)),
      Math.min(1, Math.max(0, parsed.g)),
      Math.min(1, Math.max(0, parsed.b)),
    ] as [number, number, number];
  } catch {
    return fallback;
  }
};

const AbstractGradientBackground: React.FC<AbstractGradientBackgroundProps> = ({
  className = '',
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
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const quadBufferRef = useRef<WebGLBuffer | null>(null);
  const animationRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const targetAreasRef = useRef<TargetArea[]>([]);

  const backgroundStringRef = useRef('oklch(97.5% 0.01 0)');
  const backgroundRgbRef = useRef<[number, number, number]>([0.97, 0.97, 0.98]);

  const sphereStateRef = useRef({
    positions: new Float32Array(MAX_SPHERES * 2),
    velocities: new Float32Array(MAX_SPHERES * 2),
    targets: new Float32Array(MAX_SPHERES * 2),
    radii: new Float32Array(MAX_SPHERES),
    alphas: new Float32Array(MAX_SPHERES),
    colors: new Float32Array(MAX_SPHERES * 3),
    count: Math.min(numSpheres, MAX_SPHERES),
  });

  useEffect(() => {
    const parent = parentRef.current;
    const canvas = canvasRef.current;
    if (!parent || !canvas) return undefined;

    const gl = canvas.getContext('webgl', {
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.warn('WebGL not available; gradient disabled.');
      return undefined;
    }

    glRef.current = gl;

    try {
      programRef.current = createProgram(
        gl,
        vertexShaderSource,
        fragmentShaderSource,
      );
    } catch (error) {
      console.error('Failed to build shader program', error);
      return undefined;
    }

    const program = programRef.current;
    gl.useProgram(program);

    const quadBuffer = gl.createBuffer();
    if (!quadBuffer) return undefined;
    quadBufferRef.current = quadBuffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniformLocations = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      count: gl.getUniformLocation(program, 'u_count'),
      positions: gl.getUniformLocation(program, 'u_positions'),
      radius: gl.getUniformLocation(program, 'u_radius'),
      alpha: gl.getUniformLocation(program, 'u_alpha'),
      colors: gl.getUniformLocation(program, 'u_colors'),
      background: gl.getUniformLocation(program, 'u_background'),
    };

    const updateBackground = (color: string) => {
      backgroundStringRef.current = color;
      backgroundRgbRef.current = colorToVec3(color, backgroundRgbRef.current);
    };

    const computeTargetAreas = (width: number, height: number) => {
      const targetSize = Math.min(width, height) * 0.12;
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
    };

    const pickTarget = () => {
      const areas = targetAreasRef.current;
      const { width, height } = dimensionsRef.current;
      if (!areas.length) {
        return { x: width / 2, y: height / 2 };
      }
      const area = areas[Math.floor(Math.random() * areas.length)];
      return {
        x: Math.random() * (area.xMax - area.xMin) + area.xMin,
        y: Math.random() * (area.yMax - area.yMin) + area.yMin,
      };
    };

    const initializeSpheres = () => {
      const { width, height } = dimensionsRef.current;
      const state = sphereStateRef.current;
      const rMin = minSphereRadius;
      const rMax = Math.min(width, height) * maxSphereRadiusFactor;
      const [opacityMin, opacityMax] = opacityRange;

      state.count = Math.min(numSpheres, MAX_SPHERES);
      const palette = sphereColors.map((c) => colorToVec3(c, [0.5, 0.5, 0.5]));

      for (let i = 0; i < state.count; i += 1) {
        const radius = rMin + Math.random() * (rMax - rMin);
        const alpha = opacityMin + Math.random() * (opacityMax - opacityMin);
        const color = palette[i % palette.length];
        const spawn = pickTarget();
        const target = pickTarget();

        state.radii[i] = radius;
        state.alphas[i] = alpha;
        state.positions[i * 2] = spawn.x;
        state.positions[i * 2 + 1] = spawn.y;
        state.targets[i * 2] = target.x;
        state.targets[i * 2 + 1] = target.y;
        state.velocities[i * 2] = (Math.random() * 2 - 1) * baseVelocity;
        state.velocities[i * 2 + 1] = (Math.random() * 2 - 1) * baseVelocity;
        state.colors.set(color, i * 3);
      }

      for (let i = state.count; i < MAX_SPHERES; i += 1) {
        state.radii[i] = 0;
        state.alphas[i] = 0;
        state.positions[i * 2] = width / 2;
        state.positions[i * 2 + 1] = height / 2;
        state.targets[i * 2] = width / 2;
        state.targets[i * 2 + 1] = height / 2;
        state.colors.set([0, 0, 0], i * 3);
        state.velocities[i * 2] = 0;
        state.velocities[i * 2 + 1] = 0;
      }
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.8);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));
      dimensionsRef.current = { width, height };
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      gl.viewport(0, 0, width, height);
      computeTargetAreas(width, height);
      initializeSpheres();
    };

    const step = () => {
      const { positions, velocities, targets, radii, alphas, colors, count } =
        sphereStateRef.current;
      const { width, height } = dimensionsRef.current;

      for (let i = 0; i < count; i += 1) {
        const idx = i * 2;
        const dx = targets[idx] - positions[idx];
        const dy = targets[idx + 1] - positions[idx + 1];

        velocities[idx] =
          (velocities[idx] + dx * attractionStrength) * dampingFactor +
          (Math.random() * 2 - 1) * noiseIntensity;
        velocities[idx + 1] =
          (velocities[idx + 1] + dy * attractionStrength) * dampingFactor +
          (Math.random() * 2 - 1) * noiseIntensity;

        positions[idx] += velocities[idx];
        positions[idx + 1] += velocities[idx + 1];

        if (
          Math.hypot(dx, dy) < radii[i] * 0.25 ||
          positions[idx] < -radii[i] ||
          positions[idx] > width + radii[i] ||
          positions[idx + 1] < -radii[i] ||
          positions[idx + 1] > height + radii[i]
        ) {
          const next = pickTarget();
          targets[idx] = next.x;
          targets[idx + 1] = next.y;
        }
      }

      if (uniformLocations.resolution) {
        gl.uniform2f(uniformLocations.resolution, width, height);
      }
      if (uniformLocations.count) gl.uniform1i(uniformLocations.count, count);
      if (uniformLocations.positions)
        gl.uniform2fv(uniformLocations.positions, positions);
      if (uniformLocations.radius)
        gl.uniform1fv(uniformLocations.radius, radii);
      if (uniformLocations.alpha) gl.uniform1fv(uniformLocations.alpha, alphas);
      if (uniformLocations.colors)
        gl.uniform3fv(uniformLocations.colors, colors);
      if (uniformLocations.background)
        gl.uniform3fv(uniformLocations.background, backgroundRgbRef.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(step);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateFromMedia = () => {
      updateBackground(
        mediaQuery.matches ? 'oklch(20% 0.01 0)' : 'oklch(97.5% 0.01 0)',
      );
    };
    updateFromMedia();
    if (parent.classList.contains('dark')) {
      updateBackground('oklch(20% 0.01 0)');
    }
    mediaQuery.addEventListener('change', updateFromMedia);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const target = mutation.target as HTMLElement;
          const isDark = target.classList.contains('dark');
          updateBackground(
            isDark ? 'oklch(20% 0.01 0)' : 'oklch(97.5% 0.01 0)',
          );
        }
      });
    });
    mutationObserver.observe(parent, {
      attributes: true,
      attributeFilter: ['class'],
    });

    resize();
    step();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(parent);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      mediaQuery.removeEventListener('change', updateFromMedia);
      mutationObserver.disconnect();
      resizeObserver.disconnect();

      if (quadBufferRef.current) gl.deleteBuffer(quadBufferRef.current);
      if (programRef.current) gl.deleteProgram(programRef.current);
    };
  }, [
    attractionStrength,
    baseVelocity,
    dampingFactor,
    maxSphereRadiusFactor,
    minSphereRadius,
    noiseIntensity,
    numSpheres,
    opacityRange,
    sphereColors,
  ]);

  return (
    <div
      ref={parentRef}
      className={`w-full h-full overflow-hidden fixed -z-10 ${className}`}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${blurIntensity} brightness-125`}
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
