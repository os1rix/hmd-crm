"use client";

import type { Appearance } from "@/lib/user-preferences";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "hmd-appearance";

type ThemeContextValue = {
  appearance: Appearance;
  setAppearance: (value: Appearance) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  appearance: "dark",
  setAppearance: () => {},
});

function resolveTheme(appearance: Appearance): "dark" | "light" {
  if (appearance === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return appearance;
}

function applyTheme(appearance: Appearance) {
  const resolved = resolveTheme(appearance);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({
  children,
  initialAppearance = "dark",
}: {
  children: React.ReactNode;
  initialAppearance?: Appearance;
}) {
  const [appearance, setAppearanceState] = useState<Appearance>(initialAppearance);

  const setAppearance = useCallback((value: Appearance) => {
    setAppearanceState(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Appearance | null;
    const next =
      stored === "light" || stored === "dark" || stored === "system" ? stored : initialAppearance;
    setAppearanceState(next);
    applyTheme(next);
  }, [initialAppearance]);

  useEffect(() => {
    if (appearance !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance]);

  return (
    <ThemeContext.Provider value={{ appearance, setAppearance }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function readStoredAppearance(): Appearance | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : null;
}
