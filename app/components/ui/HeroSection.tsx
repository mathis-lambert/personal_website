"use client";
import React from "react";
import { motion } from "framer-motion";
import { Heading1 } from "@/components/ui/Headings";
import GlowingText from "@/components/ui/GlowingText";
import { Badge } from "@/components/ui/Badge";
import { Patchwork } from "./Patchwork";

interface StickerConfig {
  id: number;
  src: string;
  alt: string;
  width: string;
  height: string;
  top: string; // Tailwind class, e.g., 'top-4', 'top-[10%]'
  left?: string; // Tailwind class, e.g., 'left-8', 'left-[20%]'
  right?: string; // Tailwind class, e.g., 'right-2', 'right-[15%]'
  rotation: number;
  zIndex: number;
  animationDelay: number;
}

// ***** IMPORTANT *****
const stickerData: StickerConfig[] = [
  {
    id: 2,
    src: "/images/sticker-2.png",
    alt: "Sticker 2",
    width: "w-[120px]",
    height: "h-[120px]",
    top: "top-[-1rem]",
    left: "left-[25%]",
    rotation: 5,
    zIndex: 20,
    animationDelay: 0.6,
  },
  {
    id: 3,
    src: "/images/sticker-11.png",
    alt: "Sticker 3",
    width: "w-[152px]",
    height: "h-[152px]",
    top: "top-[3rem]", // Example: 48px from top edge
    left: "left-[-1.5rem]", // Example: -24px from left edge
    rotation: 10,
    zIndex: 30,
    animationDelay: 0.7,
  },
  {
    id: 4,
    src: "/images/sticker-10.png",
    alt: "Sticker 4",
    width: "w-[136px]",
    height: "h-[136px]",
    top: "top-[5rem]", // Example: 80px from top edge
    right: "right-4", // Example: 16px from right edge
    rotation: -15,
    zIndex: 10,
    animationDelay: 0.7,
  },
];

export const HeroSection: React.FC = () => {
  return (
    <div className="flex flex-col-reverse md:flex-row items-center md:items-start mt-24 md:mt-30 mb-24 gap-12 md:gap-8">
      {/* Text Content Section */}
      <div className="w-full md:w-3/4">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, ease: "easeInOut", delay: 0.1 }}
          >
            <Heading1>Hi, I&apos;m Mathis Lambert !</Heading1>
            <Heading1>
              <span className="opacity-20">I&apos;m an</span> engineering
              student
            </Heading1>
            <Heading1>
              <span className="opacity-20">in</span>&nbsp;
              <GlowingText color={"text-sky-500"}>AI</GlowingText>&nbsp;
              <span className="opacity-20">and</span>&nbsp;
              <GlowingText color={"text-sky-500"}>Computer science</GlowingText>
            </Heading1>
            <div className={"flex items-center gap-2 mt-4 flex-wrap"}>
              <Badge
                content={"Working at Free Pro"}
                colorScheme={"green"}
                delay={0}
              />
              <Badge
                content={"Studying at CPE Lyon"}
                colorScheme={"blue"}
                delay={0.25}
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.75, ease: "easeInOut", delay: 0.2 }}
            exit={{ opacity: 0, y: -50 }}
            className="mt-8"
          >
            <p className="text-lg text-gray-600 dark:text-gray-400">
              I&apos;m passionate about AI, machine learning, and data science,
              and I enjoy working on practical and innovative solutions within a
              collaborative environment. <br />
              With a focus on continuous learning and technical reliability, I
              aim to grow through meaningful, hands-on projects.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Image Patchwork Section Container */}
      <div className="w-full md:w-1/4 flex justify-center md:justify-start">
        <Patchwork stickers={stickerData} />
      </div>
    </div>
  );
};
