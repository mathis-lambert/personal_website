import React from 'react';

interface GlassCardProps {
  title?: string;
  pt?: number;
  size?: string; // 'small' | 'medium' | 'large'
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ title, pt = 5, size, children }) => {
  return (
    <div
      className={`glass-card ${size} p-5 border bg-[rgba(245,245,245,0.1)] dark:bg-[rgba(20,20,20,0.3)] border-[rgba(254,254,254,1)] dark:border-[rgba(40,40,40,1)]`}
      style={{ paddingTop: pt }}
    >
      {title && (
        <div className="glass-card__title bg-[rgba(254,254,254,1)] dark:bg-[rgba(40,40,40,1)] p-2 mb-4">
          <span>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
};

export default GlassCard;
