import { useEffect, useState } from "react";

export type ThemeMode = "system" | "dark" | "light";

const THEME_STORAGE_KEY = "anticore_theme_mode";

export function getStoredTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light" || saved === "system") {
    return saved;
  }
  return "system";
}

export function getEffectiveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  const effective = getEffectiveTheme(mode);
  const root = document.documentElement;
  
  if (effective === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [effective, setEffectiveState] = useState<"dark" | "light">(() =>
    getEffectiveTheme(getStoredTheme())
  );

  useEffect(() => {
    applyTheme(theme);
    setEffectiveState(getEffectiveTheme(theme));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
        setEffectiveState(media.matches ? "dark" : "light");
      }
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
    setEffectiveState(getEffectiveTheme(mode));
  };

  return { theme, effective, setTheme };
}
