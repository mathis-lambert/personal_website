"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reset the scroll position on navigation.
 *
 * Instant, not smooth: animating back to the top on every route change means
 * the incoming page visibly slides past before it settles.
 */
const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Leave hash navigation alone: forcing the top here cancelled the browser
    // jump to #path or #workshop before it happened.
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
