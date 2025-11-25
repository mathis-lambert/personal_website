"use client";
import { motion } from "framer-motion";

const baseClassName =
  "text-gray-900 dark:text-gray-100 break-word font-extrabold transition-colors duration-300 ease-in-out";

const Heading1 = ({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  return (
    // responsive size sm:text-3xl lg:text-5xl
    <motion.h1
      className={`text-4xl sm:text-5xl ${baseClassName} ${className}`}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.75, ease: "easeOut", delay: delay }}
      exit={{ opacity: 0, x: -50 }}
    >
      {children}
    </motion.h1>
  );
};

const Heading2 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2 className={`text-4xl ${baseClassName} ${className}`}>{children}</h2>
  );
};

const Heading3 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3 className={`text-3xl ${baseClassName} ${className}`}>{children}</h3>
  );
};

const Heading4 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h4 className={`text-2xl ${baseClassName} ${className}`}>{children}</h4>
  );
};

const Heading5 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h5 className={`text-xl ${baseClassName} ${className}`}>{children}</h5>
  );
};

export { Heading1, Heading2, Heading3, Heading4, Heading5 };
