"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-shot in-view flag.
 *
 * The observer disconnects on the first intersection and nothing re-renders
 * afterwards, and anything already above the fold on mount skips the observer
 * entirely. Both `Reveal` and `Squiggle` need exactly this, so it lives here
 * rather than being written twice with two sets of thresholds that drift apart.
 */
export function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, inView } as const;
}
