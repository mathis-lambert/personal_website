import React, { useEffect, useRef } from 'react';
import '@/style/AbstractGradientBackground.css';
import GrainEffect from '@/components/ui/GrainEffect.tsx';

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

interface Props {
    className?: string;
    sphereColors?: string[];
}

const AbstractGradientBackground: React.FC<Props> = ({
    className,
    sphereColors,
}) => {
    const parentRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const blurCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const parent = parentRef.current;
        const canvas = canvasRef.current;
        const blurCanvas = blurCanvasRef.current;
        if (!parent || !canvas || !blurCanvas) return;

        // get parent background color
        const backgroundColor = window.getComputedStyle(parent).backgroundColor;

        const ctx = canvas.getContext('2d');
        const blurCtx = blurCanvas.getContext('2d');
        if (!ctx || !blurCtx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        // Set dimensions of canvases
        canvas.width = blurCanvas.width = width;
        canvas.height = blurCanvas.height = height;

        // Colors of spheres
        const colors = sphereColors || ['#9213C6', '#1B5FD9', '#29E6EA'];

        // Number of points
        const numPoints = 6;

        // Target size
        let targetSize = Math.min(width, height) * 0.1;

        // Target areas for spheres
        const targetAreas = [
            { xMin: 0, xMax: targetSize, yMin: height - targetSize, yMax: height }, // Bottom left
            {
                xMin: width - targetSize,
                xMax: width,
                yMin: height - targetSize,
                yMax: height,
            }, // Bottom right
            {
                xMin: width / 2 - targetSize / 2,
                xMax: width / 2 + targetSize / 2,
                yMin: height - targetSize,
                yMax: height,
            }, // Middle bottom
            {
                xMin: width - targetSize,
                xMax: width,
                yMin: height / 2 - targetSize / 2,
                yMax: height / 2 + targetSize / 2,
            }, // Middle right
        ];

        // Function to get a random target
        const getRandomTarget = () => {
            const area = targetAreas[Math.floor(Math.random() * targetAreas.length)];
            const x = Math.random() * (area.xMax - area.xMin) + area.xMin;
            const y = Math.random() * (area.yMax - area.yMin) + area.yMin;
            return { x, y };
        };

        // Range of radii for spheres
        const r_min = 250;
        const r_max = Math.min(width, height) / 3;

        // Initialize points (spheres)
        const points: Point[] = Array.from({ length: numPoints }, () => {
            const r = Math.random() * (r_max - r_min) + r_min;
            const x = Math.random() * width;
            const y = Math.random() * height;
            const { x: targetX, y: targetY } = getRandomTarget();
            return {
                x,
                y,
                vx: Math.random() * 0.6 - 0.3,
                vy: Math.random() * 0.6 - 0.3,
                r,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random() * 0.5 + 0.5,
                targetX,
                targetY,
            };
        });

        // Function to get color with opacity
        const getColorWithOpacity = (hexColor: string, opacity: number): string => {
            const r = parseInt(hexColor.substring(1, 3), 16);
            const g = parseInt(hexColor.substring(3, 5), 16);
            const b = parseInt(hexColor.substring(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        // Drawing function
        const drawGradient = () => {
            // Clear and fill main canvas with background color
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);

            // Draw each sphere
            points.forEach((point) => {
                const gradient = ctx.createRadialGradient(
                    point.x,
                    point.y,
                    0,
                    point.x,
                    point.y,
                    point.r,
                );
                gradient.addColorStop(
                    0,
                    getColorWithOpacity(point.color, point.opacity),
                );
                gradient.addColorStop(
                    0.7,
                    getColorWithOpacity(point.color, point.opacity * 0.5),
                );
                gradient.addColorStop(1, getColorWithOpacity(point.color, 0));

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
                ctx.fill();

                // Attraction force towards target
                const attractionStrength = 0.000015;
                const dx = point.targetX - point.x;
                const dy = point.targetY - point.y;
                point.vx += attractionStrength * dx;
                point.vy += attractionStrength * dy;

                // Add random noise for organic movement
                point.vx += Math.random() * 0.1 - 0.05;
                point.vy += Math.random() * 0.1 - 0.05;

                // Damping velocity
                point.vx *= 0.99;
                point.vy *= 0.99;

                // Update position
                point.x += point.vx;
                point.y += point.vy;

                // Check if sphere has reached its target
                const distanceSquared =
                    (point.x - point.targetX) ** 2 + (point.y - point.targetY) ** 2;
                if (distanceSquared < (point.r / 2) ** 2) {
                    const { x: newTargetX, y: newTargetY } = getRandomTarget();
                    point.targetX = newTargetX;
                    point.targetY = newTargetY;
                }
            });

            // Apply blur effect
            blurCtx.globalAlpha = 0.45;
            blurCtx.drawImage(canvas, 0, 0);

            // Continue animation
            requestAnimationFrame(drawGradient);
        };

        // Initialize blur canvas with background color
        blurCtx.fillStyle = backgroundColor;
        blurCtx.fillRect(0, 0, width, height);

        // Start drawing
        drawGradient();

        // Resize handler
        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = blurCanvas.width = width;
            canvas.height = blurCanvas.height = height;

            targetSize = Math.min(width, height) * 0.1;

            // Update target areas
            targetAreas[0].xMax = targetSize;
            targetAreas[0].yMin = height - targetSize;
            targetAreas[1].xMin = width - targetSize;
            targetAreas[1].yMin = height - targetSize;
            targetAreas[2].xMin = width / 2 - targetSize / 2;
            targetAreas[2].xMax = width / 2 + targetSize / 2;
            targetAreas[2].yMin = height - targetSize;
            targetAreas[2].yMax = height;
            targetAreas[3].xMin = width - targetSize;
            targetAreas[3].xMax = width;
            targetAreas[3].yMin = height / 2 - targetSize / 2;
            targetAreas[3].yMax = height / 2 + targetSize / 2;

            // Reset points
            points.forEach((point) => {
                const r = Math.random() * (r_max - r_min) + r_min;
                point.x = Math.random() * width;
                point.y = Math.random() * height;
                const { x: newTargetX, y: newTargetY } = getRandomTarget();
                point.targetX = newTargetX;
                point.targetY = newTargetY;
                point.r = r;
            });

            // Reset blur canvas
            blurCtx.fillStyle = backgroundColor;
            blurCtx.fillRect(0, 0, width, height);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [className, sphereColors]);

    return (
        <div
            ref={parentRef}
            className={`w-full h-full overflow-hidden fixed bg-gray-100`}
        >
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={blurCanvasRef} className="absolute top-0 left-0 w-full h-full blur-3xl brightness-125" />
            <GrainEffect
              size={70}      // Intensité
              speed={0.1}      // Vitesse
              resolution={65} // Finesse du grain
            />
            {/*<div className="grain"></div>*/}
        </div>
    );
};

export default AbstractGradientBackground;
