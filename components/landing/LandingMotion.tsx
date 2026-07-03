"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/** Lazy-loads framer-motion features for the landing page bundle. */
export function LandingMotion({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

export { m } from "framer-motion";
