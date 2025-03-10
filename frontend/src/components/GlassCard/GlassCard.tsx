import React from 'react';
import './GlassCard.scss';
import { Box } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode.tsx';


interface GlassCardProps {
  title?: string;
  pt?: number;
  size?: string; // 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ title, pt, size, children }) => {

  const bg = useColorModeValue('rgba(245, 245, 245, 0.1)', 'rgba(20, 20, 20, 0.3)');
  const borderColor = useColorModeValue('rgba(254, 254, 254, 1)', 'rgba(40, 40, 40, 1)');

  return (
    <Box className={`glass-card ${size}`} p={5} bg={bg} borderColor={borderColor} pt={pt}>
      {title &&
        <Box className="glass-card__title" bg={borderColor}>
          <span>{title}</span>
        </Box>
      }
      {children}
    </Box>
  );
};

export default GlassCard;