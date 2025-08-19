import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cloneElement, memo } from 'react';

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 10,
  },
  in: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    scale: 0.98,
    y: -10,
  },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 30,
  duration: 0.1,
};

const AnimatedOutletComponent = () => {
  const location = useLocation();
  const element = useOutlet();

  return (
    <AnimatePresence mode="popLayout" initial>
      {element && (
        <motion.div
          key={location.pathname}
          className="relative w-full"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          <div className="mx-auto w-full min-h-screen max-w-5xl pt-20 md:pt-24 lg:pt-28 pb-10 px-4 lg:px-2">
            {cloneElement(element, { key: location.pathname })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AnimatedOutlet = memo(AnimatedOutletComponent);

export default AnimatedOutlet;
