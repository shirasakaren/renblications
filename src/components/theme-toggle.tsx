"use client";

import { Moon, Sun, SunHorizon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const reduce = useReducedMotion();
  const next = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
  const label = `Theme: ${mode}. Switch to ${next}.`;
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : SunHorizon;

  return (
    <motion.button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      whileTap={reduce ? undefined : { rotate: -8, scale: 0.92 }}
      onClick={() => setMode(next)}
    >
      <Icon size={17} weight="regular" aria-hidden="true" />
    </motion.button>
  );
}
