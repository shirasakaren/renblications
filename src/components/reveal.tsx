"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "./theme-provider";

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const deviceReduce = useReducedMotion();
  const { motionLevel } = useTheme();
  const reduce = deviceReduce || motionLevel === "reduced";
  const offset = motionLevel === "expressive" ? 24 : 12;
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 1, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: motionLevel === "expressive" ? 0.65 : 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
