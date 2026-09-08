import { useEffect, useState } from "react";

export type ThemeMode =
  | "system"
  | "obsidian"
  | "amber"
  | "cobalt"
  | "cyberpunk"
  | "amethyst"
  | "titanium";

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  description: string;
  accent: string;
  bg: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "obsidian",
    name: "Obsidian Emerald",
    description: "Varsayılan derin obsidyen şasi ve neon siber zümrüt",
    accent: "#00F59B",
    bg: "#06080C",
  },
  {
    id: "amber",
    name: "Amber CRT",
    description: "Endüstriyel termal kehribar fosfor monitör estetiği",
    accent: "#FFB020",
    bg: "#0C0A06",
  },
  {
    id: "cobalt",
    name: "Cobalt Matrix",
    description: "Taktik denizaltı C2 kontrol konsolu ve polar mavi spektrum",
    accent: "#00E5FF",
    bg: "#050B14",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Volt",
    description: "Yüksek gerilim neon sarı ve koyu mat titanyum",
    accent: "#FFE600",
    bg: "#08090D",
  },
  {
    id: "amethyst",
    name: "Amethyst Nebula",
    description: "Kozmik ametist moru ve spektral lavanta",
    accent: "#B388FF",
    bg: "#090610",
  },
  {
    id: "titanium",
    name: "Titanium Laboratory",
    description: "CNC işlenmiş titanyum açık alüminyum ve cerrahi zümrüt",
    accent: "#047857",
    bg: "#F1F5F9",
  },
  {
    id: "system",
    name: "Sistem",
    description: "İşletim sistemi temasına otomatik senkronize",
    accent: "#00F59B",
    bg: "#141B2B",
  },
];

const THEME_STORAGE_KEY = "anticore_theme_mode";

export function getStoredTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (
    saved === "obsidian" ||
    saved === "amber" ||
    saved === "cobalt" ||
    saved === "cyberpunk" ||
    saved === "amethyst" ||
    saved === "titanium" ||
    saved === "system"
  ) {
    return saved;
  }
  // Geriye dönük uyumluluk
  if (saved === "dark") return "obsidian";
  if (saved === "light") return "titanium";
  return "obsidian";
}

export function getEffectiveTheme(mode: ThemeMode): Exclude<ThemeMode, "system"> {
  if (mode === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDark ? "obsidian" : "titanium";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  const effective = getEffectiveTheme(mode);
  const root = document.documentElement;

  // Önceki tema sınıflarını temizle
  root.classList.remove(
    "dark",
    "light",
    "theme-obsidian",
    "theme-amber",
    "theme-cobalt",
    "theme-cyberpunk",
    "theme-amethyst",
    "theme-titanium"
  );

  if (effective === "titanium") {
    root.classList.add("light", "theme-titanium");
  } else {
    root.classList.add("dark", `theme-${effective}`);
  }

  root.setAttribute("data-theme", effective);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [effective, setEffectiveState] = useState<Exclude<ThemeMode, "system">>(() =>
    getEffectiveTheme(getStoredTheme())
  );

  useEffect(() => {
    applyTheme(theme);
    setEffectiveState(getEffectiveTheme(theme));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
        setEffectiveState(media.matches ? "obsidian" : "titanium");
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

  return { theme, effective, setTheme, options: THEME_OPTIONS };
}
