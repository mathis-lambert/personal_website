"use client";

import { motion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function SiteTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Keep a light entry animation per page without gating children animations.
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
