"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppearanceSettings, ThemeMode } from "@/lib/types";
import { getTheme } from "@/lib/themes";

interface ThemeContextValue {
  themeId: string;
  mode: ThemeMode;
  resolved: "light" | "dark";
  motionLevel: AppearanceSettings["motionLevel"];
  allowVisitorMode: boolean;
  setThemeId: (id: string) => void;
  setMode: (mode: ThemeMode) => void;
  preview: (id: string, mode: ThemeMode, motionLevel?: AppearanceSettings["motionLevel"]) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const modeKey = "ren-publications-theme-mode:v1";

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(id: string, mode: ThemeMode): "light" | "dark" {
  const theme = getTheme(id);
  const resolved = resolveMode(mode);
  const palette = theme[resolved];
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.dataset.mode = mode;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = mode === "system" ? "light dark" : resolved;
  for (const [variant, values] of [["light", theme.light], ["dark", theme.dark]] as const) {
    root.style.setProperty(`--theme-${variant}-bg`, values.bg);
    root.style.setProperty(`--theme-${variant}-surface`, values.surface);
    root.style.setProperty(`--theme-${variant}-surface-muted`, values.surfaceMuted);
    root.style.setProperty(`--theme-${variant}-ink`, values.ink);
    root.style.setProperty(`--theme-${variant}-ink-muted`, values.inkMuted);
    root.style.setProperty(`--theme-${variant}-line`, values.line);
    root.style.setProperty(`--theme-${variant}-accent`, values.accent);
    root.style.setProperty(`--theme-${variant}-accent-strong`, values.accentStrong);
    root.style.setProperty(`--theme-${variant}-accent-ink`, values.accentInk);
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", palette.bg);
  return resolved;
}

export function ThemeProvider({
  appearance,
  children,
}: {
  appearance: AppearanceSettings;
  children: React.ReactNode;
}) {
  const [themeId, setThemeIdState] = useState(appearance.themeId);
  const [mode, setModeState] = useState<ThemeMode>(appearance.mode);
  const [motionLevel, setMotionLevel] = useState(appearance.motionLevel);
  const [resolved, setResolved] = useState<"light" | "dark">(
    appearance.mode === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    const stored = appearance.allowVisitorMode
      ? (window.localStorage.getItem(modeKey) as ThemeMode | null)
      : null;
    const initialMode = stored && ["light", "dark", "system"].includes(stored) ? stored : appearance.mode;
    // This is a deliberate post-hydration reconciliation with the visitor's persisted browser preference.
    /* eslint-disable react-hooks/set-state-in-effect */
    setThemeIdState(appearance.themeId);
    setModeState(initialMode);
    setMotionLevel(appearance.motionLevel);
    setResolved(applyTheme(appearance.themeId, initialMode));
    document.body.dataset.motion = appearance.motionLevel;
    /* eslint-enable react-hooks/set-state-in-effect */

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      if (initialMode === "system") setResolved(applyTheme(appearance.themeId, "system"));
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [appearance]);

  const setThemeId = useCallback(
    (id: string) => {
      setThemeIdState(id);
      setResolved(applyTheme(id, mode));
    },
    [mode],
  );

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      if (appearance.allowVisitorMode) window.localStorage.setItem(modeKey, nextMode);
      setResolved(applyTheme(themeId, nextMode));
    },
    [appearance.allowVisitorMode, themeId],
  );

  const preview = useCallback((id: string, nextMode: ThemeMode, motionLevel?: AppearanceSettings["motionLevel"]) => {
    setThemeIdState(id);
    setModeState(nextMode);
    setResolved(applyTheme(id, nextMode));
    if (motionLevel) {
      setMotionLevel(motionLevel);
      document.body.dataset.motion = motionLevel;
    }
  }, []);

  const value = useMemo(
    () => ({ themeId, mode, resolved, motionLevel, allowVisitorMode: appearance.allowVisitorMode, setThemeId, setMode, preview }),
    [themeId, mode, resolved, motionLevel, appearance.allowVisitorMode, setThemeId, setMode, preview],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider.");
  return value;
}
