"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)", scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(6px)",
    scale: 0.995,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

export default function SiteTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
