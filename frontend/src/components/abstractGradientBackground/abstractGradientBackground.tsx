import React, {useEffect, useRef} from 'react';
import './AbstractGradientBackground.scss';

interface Point {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    color: string;
    opacity: number;
}

const AbstractGradientBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const blurCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const blurCanvas = blurCanvasRef.current;
        if (!canvas || !blurCanvas) return;

        const ctx = canvas.getContext('2d');
        const blurCtx = blurCanvas.getContext('2d');
        if (!ctx || !blurCtx) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Définir les dimensions des canvas
        canvas.width = blurCanvas.width = width;
        canvas.height = blurCanvas.height = height;

        // Couleurs à utiliser
        const colors = ['#9213C6', '#1B5FD9', '#29E6EA'];

        // Création des points
        const points: Point[] = Array.from({length: 10}, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.random() * 0.6 - 0.3,
            vy: Math.random() * 0.6 - 0.3,
            r: Math.random() * 350 + 200, // Rayon aléatoire entre 200 et 450
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: Math.random() * 0.7 + 0.5,
        }));

        // Fonction utilitaire pour convertir une couleur hexadécimale en rgba
        const getColorWithOpacity = (hexColor: string, opacity: number): string => {
            const r = parseInt(hexColor.substring(1, 3), 16);
            const g = parseInt(hexColor.substring(3, 5), 16);
            const b = parseInt(hexColor.substring(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        const drawGradient = () => {
            // Effacer le canvas principal et remplir avec du noir
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillRect(0, 0, width, height);

            // Dessiner chaque gradient
            points.forEach(point => {
                const gradient = ctx.createRadialGradient(
                    point.x, point.y, 0,
                    point.x, point.y, point.r
                );
                gradient.addColorStop(0, getColorWithOpacity(point.color, point.opacity));
                gradient.addColorStop(0.7, getColorWithOpacity(point.color, point.opacity * 0.3));
                gradient.addColorStop(1, getColorWithOpacity(point.color, 0));

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
                ctx.fill();

                // Mise à jour de la position et rebond sur les bords
                point.x += point.vx;
                point.y += point.vy;

                if (point.x < -point.r) point.x = width + point.r;
                if (point.x > width + point.r) point.x = -point.r;
                if (point.y < -point.r) point.y = height + point.r;
                if (point.y > height + point.r) point.y = -point.r;
            });

            // Appliquer l'effet de traînée sur le canvas de flou
            blurCtx.globalAlpha = 0.92;
            blurCtx.drawImage(canvas, 0, 0);

            requestAnimationFrame(drawGradient);
        };

        // Initialiser le canvas de flou avec un fond noir
        blurCtx.fillStyle = '#000';
        blurCtx.fillRect(0, 0, width, height);

        drawGradient();

        // Gestion du redimensionnement
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            canvas.width = blurCanvas.width = newWidth;
            canvas.height = blurCanvas.height = newHeight;

            blurCtx.fillStyle = '#000';
            blurCtx.fillRect(0, 0, newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="gradient-background-container">
            <canvas ref={canvasRef} className="gradient-canvas-hidden"/>
            <canvas ref={blurCanvasRef} className="gradient-canvas-blur"/>
        </div>
    );
};

export default AbstractGradientBackground;
