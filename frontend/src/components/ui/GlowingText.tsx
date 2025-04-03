import React from 'react';
import colors from 'tailwindcss/colors';
import { oklch, converter } from 'culori';

// On définit un type pour générer une union de toutes les couleurs disponibles sous la forme "nom-teinte"
type TailwindColor = {
  [K in keyof typeof colors]: (typeof colors)[K] extends Record<string, string>
    ? `text-${K}-${Extract<keyof (typeof colors)[K], string>}`
    : never;
}[keyof typeof colors];

interface GlowingTextProps {
  children: React.ReactNode;
  color?: TailwindColor; // ex: "blue-500", "red-500", etc.
}

const convertToRGBA = (colorStr: string, alpha: number) => {
  if (colorStr.startsWith('oklch')) {
    const rgbaColor = converter('rgb')(oklch(colorStr));
    if (rgbaColor) {
      return `rgba(${Math.round(rgbaColor.r * 255)}, ${Math.round(rgbaColor.g * 255)}, ${Math.round(rgbaColor.b * 255)}, ${alpha})`;
    }
  }
  return colorStr; // Au cas où
};

const GlowingText: React.FC<GlowingTextProps> = ({
  children,
  color = 'blue-500',
}) => {
  const colorValue = color.split('text-')[1];
  const [colorName, shade] = colorValue.split('-');

  if (!(colorName in colors)) {
    console.error(`La couleur ${colorName} n'existe pas dans Tailwind.`);
    return <span>{children}</span>;
  }

  const colorObject = colors[colorName as keyof typeof colors] as Record<
    string,
    string
  >;
  const rawColor = colorObject[shade];

  if (!rawColor) {
    console.error(`La teinte ${shade} n'existe pas pour ${colorName}`);
    return <span>{children}</span>;
  }

  const glowColor = convertToRGBA(rawColor, 0.5);

  return (
    <span
      className={`font-bold ${color}`}
      style={{ textShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}` }}
    >
      {children}
    </span>
  );
};

export default GlowingText;
