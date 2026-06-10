"use client";

import { useEffect, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/** Syncs reduced-motion preference to the root element for CSS fallbacks. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    document.documentElement.toggleAttribute("data-reduced-motion", reduce ?? false);
  }, [reduce]);

  return children;
}
