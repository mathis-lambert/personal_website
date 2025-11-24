"use client";
import React from "react";
import { motion } from "framer-motion";

interface StickerConfig {
  id: number;
  src: string;
  alt: string;
  width: string;
  height: string;
  top: string;
  left?: string;
  right?: string;
  rotation: number;
  zIndex: number;
  animationDelay: number;
}

interface PatchworkProps {
  stickers: StickerConfig[];
}

export const Patchwork: React.FC<PatchworkProps> = ({ stickers }) => {
  return (
    <div className="relative w-[60%] sm:w-[40%] md:w-full h-60 md:h-96">
      {stickers.map((sticker) => {
        const stickerVariants = {
          hidden: {
            opacity: 0,
            scale: 0.5,
            rotate: sticker.rotation - 30,
          },
          visible: {
            opacity: 1,
            scale: 1,
            rotate: sticker.rotation,
            transition: {
              delay: sticker.animationDelay,
              type: "spring",
              stiffness: 150,
              damping: 15,
            },
          },
          hover: {
            scale: 1.1,
            transition: {
              delay: 0,
              type: "spring",
              stiffness: 200,
              damping: 15,
            },
          },
        } as const;

        return (
          <motion.img
            key={sticker.id}
            src={sticker.src}
            alt={sticker.alt}
            className={`absolute object-contain ${sticker.width} ${sticker.height} ${sticker.top} ${sticker.left ?? ""} ${sticker.right ?? ""}`}
            style={{
              zIndex: sticker.zIndex,
            }}
            variants={stickerVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          />
        );
      })}
    </div>
  );
};
