"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { trackUiEvent } from "@/api/analytics";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void trackUiEvent({
      name: "page_view",
      path: pathname,
    });
  }, [pathname]);

  return null;
}
