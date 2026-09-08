import { useSyncExternalStore } from "react";

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
    description: "Havacılık sınıfı CNC obsidyen şasi, 16px kavisli cam paneller ve zümrüt telemetri",
    accent: "#00F59B",
    bg: "#06080C",
  },
  {
    id: "amber",
    name: "Amber CRT",
    description: "VT220 monokrom kehribar fosfor terminali, CRT scanline tarama ve tam monospace arayüz",
    accent: "#FFB020",
    bg: "#0C0A06",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Volt",
    description: "0px jilet keskin brutalist mecha arayüzü, endüstriyel HUD gridi ve sarı gerilim şeritleri",
    accent: "#FFE600",
    bg: "#08090D",
  },
  {
    id: "cobalt",
    name: "Cobalt Matrix",
    description: "C2 Muharebe ve denizaltı komuta konsolu, 6px taktik çerçeveler, sonar radarı ve sol polar mavi çapa",
    accent: "#00E5FF",
    bg: "#050B14",
  },
  {
    id: "amethyst",
    name: "Amethyst Nebula",
    description: "24px ultra yumuşak organik hap formları, Apple VisionOS buzlu cam ve kozmik derin nebula",
    accent: "#B388FF",
    bg: "#090610",
  },
  {
    id: "titanium",
    name: "Titanium Laboratory",
    description: "Açık mod klinik cerrahi lab, hassas 12px CNC pahlar, beyaz yükseltilmiş kartlar ve nokta ızgarası",
    accent: "#047857",
    bg: "#F1F5F9",
  },
  {
    id: "system",
    name: "Sistem",
    description: "İşletim sistemi temasına otomatik senkronize adaptif mod",
    accent: "#00F59B",
    bg: "#141B2B",
  },
];

const THEME_STORAGE_KEY = "anticore_theme_mode";

let currentTheme: ThemeMode = getStoredTheme();
const themeListeners = new Set<() => void>();

export function getStoredTheme(): ThemeMode {
  if (typeof localStorage === "undefined") return "obsidian";
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
    if (typeof window !== "undefined" && window.matchMedia) {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return isDark ? "obsidian" : "titanium";
    }
    return "obsidian";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
  const effective = getEffectiveTheme(mode);
  if (typeof document === "undefined") return;
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

export function setThemeGlobal(mode: ThemeMode) {
  currentTheme = mode;
  applyTheme(mode);
  themeListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

// İlk yüklemede temayı hemen uygula ve sistem tema değişikliklerini izle
if (typeof window !== "undefined") {
  applyTheme(currentTheme);

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (currentTheme === "system") {
        applyTheme("system");
        themeListeners.forEach((fn) => {
          try {
            fn();
          } catch {}
        });
      }
    });
  }
}

export function useTheme() {
  const theme: ThemeMode = useSyncExternalStore<ThemeMode>(
    (onStoreChange) => {
      themeListeners.add(onStoreChange);
      return () => {
        themeListeners.delete(onStoreChange);
      };
    },
    () => currentTheme,
    () => "obsidian" as ThemeMode
  );

  const effective = getEffectiveTheme(theme);

  const setTheme = (mode: ThemeMode) => {
    setThemeGlobal(mode);
  };

  return { theme, effective, setTheme, options: THEME_OPTIONS };
}
