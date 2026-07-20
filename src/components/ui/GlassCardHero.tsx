"use client";
import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  title?: string;
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
  px?: number;
  pt?: number;
  animationDelay?: number;
  className?: string;
}

const GlassCardHero: React.FC<GlassCardProps> = ({
  title,
  size = "small",
  children,
  px = 1,
  pt = 3.5,
  animationDelay = 0.5,
  className = "",
}) => {
  // Styles dynamiques
  const dynamicStyles = {
    paddingLeft: px ? `${px}rem` : undefined,
    paddingRight: px ? `${px}rem` : undefined,
    paddingTop: pt ? `${pt}rem` : undefined,
  };

  return (
    <motion.div
      className={
        `${size === "small" ? "col-span-1 xs:row-span-1" : size === "medium" ? "col-span-1 xs:col-span-2 row-span-1" : size === "large" ? "col-span-1 xs:col-span-3 row-span-1" : ""}` +
        " rounded-[2rem]"
      }
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: animationDelay, duration: 0.45 },
      }}
      exit={{ opacity: 0, y: 12 }}
      whileHover={{ y: -4 }}
    >
      <div
        className={cn(
          "paper-surface flex h-full rounded-[2rem] relative overflow-hidden transition-shadow duration-300 hover:shadow-xl",
          className,
        )}
        style={dynamicStyles}
      >
        {title && (
          <div
            className="absolute left-3 top-3 z-20 rounded-full border border-foreground/10 bg-card/92 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-foreground shadow-sm backdrop-blur-xl"
          >
            <span>{title}</span>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCardHero;
