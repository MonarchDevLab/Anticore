import { useSyncExternalStore } from "react";

export type ThemeMode =
  | "system"
  | "cyberpunk"
  | "luxury"
  | "obsidian"
  | "amber"
  | "cobalt"
  | "amethyst"
  | "crimson"
  | "titanium"
  | "abyss"
  | "solar";

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
    name: "Obsidian Core",
    description: "Derin CNC şasi (#020617), akkor alev (#ff642b) 1. cil renk ve elektrik siyanı (#00edff) 2. cil renk",
    accent: "#ff642b",
    bg: "#020617",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077",
    description: "3px mikro-kesik açılı mecha kartlar, endüstriyel HUD gridi, yüksek voltaj sarı ve siyan lazer hatlar",
    accent: "#FFE600",
    bg: "#08090D",
  },
  {
    id: "luxury",
    name: "Quiet Luxury",
    description: "Patek Philippe zarafeti, 8px ipeksi kavis, fırçalanmış şampanya altını ve kadife derin siyah şasi",
    accent: "#D4AF37",
    bg: "#0A090C",
  },
  {
    id: "crimson",
    name: "Crimson Hazard",
    description: "Taktik askeri kırmızı lazer HUD, 5px sert taktik pahlar, acil durum komuta paneli ve karbon şasi",
    accent: "#FF2A4D",
    bg: "#0B0406",
  },
  {
    id: "cobalt",
    name: "Cobalt Matrix",
    description: "C2 Muharebe ve denizaltı komuta konsolu, 6px taktik köşeler, sonar radarı ve kutup mavisi çapa",
    accent: "#00E5FF",
    bg: "#050B14",
  },
  {
    id: "amber",
    name: "Amber CRT",
    description: "VT220 monokrom kehribar fosfor terminali, 4px retro cam, CRT scanline tarama ve monospace kod arayüzü",
    accent: "#FFB020",
    bg: "#0C0A06",
  },
  {
    id: "amethyst",
    name: "Amethyst Nebula",
    description: "22px ultra yumuşak organik hap formları, Apple VisionOS derin buzlu cam ve kozmik nebula ışıması",
    accent: "#B388FF",
    bg: "#090610",
  },
  {
    id: "abyss",
    name: "Abyss Aqua",
    description: "Mariana çukuru derin akuamarin zemin, 16px hidrodinamik kavis, parlayan sualtı siyanı ve okyanus camı",
    accent: "#00F2FE",
    bg: "#031114",
  },
  {
    id: "solar",
    name: "Solar Flare",
    description: "Stealth havacılık karbon siyahı, 6px süpersonik açılar, akkor güneş turuncusu ve termal telemetri",
    accent: "#FF6B00",
    bg: "#09090B",
  },
  {
    id: "titanium",
    name: "Titanium Laboratory",
    description: "Açık mod klinik cerrahi lab, hassas 10px CNC pahlar, beyaz yükseltilmiş kartlar ve temiz gölgeler",
    accent: "#059669",
    bg: "#F1F5F9",
  },
  {
    id: "system",
    name: "Sistem (Otomatik)",
    description: "İşletim sistemi temasına otomatik senkronize adaptif mod",
    accent: "#ff642b",
    bg: "#020617",
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
    saved === "luxury" ||
    saved === "amber" ||
    saved === "cobalt" ||
    saved === "cyberpunk" ||
    saved === "amethyst" ||
    saved === "crimson" ||
    saved === "titanium" ||
    saved === "abyss" ||
    saved === "solar" ||
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
    "theme-luxury",
    "theme-amber",
    "theme-cobalt",
    "theme-cyberpunk",
    "theme-amethyst",
    "theme-crimson",
    "theme-titanium",
    "theme-abyss",
    "theme-solar"
  );

  if (effective === "titanium") {
    root.classList.add("light", "theme-titanium");
  } else {
    root.classList.add("dark", `theme-${effective}`);
  }

  root.setAttribute("data-theme", effective);
}

const THEME_EVENT = "theme_changed";

/** Temayı yalnızca bu pencerede uygular; olay yayını yapmaz. */
function applyThemeLocal(mode: ThemeMode) {
  currentTheme = mode;
  applyTheme(mode);
  themeListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function setThemeGlobal(mode: ThemeMode) {
  applyThemeLocal(mode);
  // Ana pencere ve tepsi mini paneli ayrı WebView'lerdir; tema yalnızca
  // değişikliği yapan pencerede uygulanır. Tauri olayı ile hepsini eşitler.
  void (async () => {
    try {
      const { emit } = await import("@tauri-apps/api/event");
      await emit(THEME_EVENT, mode);
    } catch {}
  })();
}

// Diğer pencerelerden gelen tema değişikliğini uygula (yankıyı önlemek için yayın yok).
void (async () => {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    await listen<ThemeMode>(THEME_EVENT, (event) => {
      if (event.payload && event.payload !== currentTheme) {
        applyThemeLocal(event.payload);
      }
    });
  } catch {}
})();

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

function subscribeTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);
  return () => {
    themeListeners.delete(onStoreChange);
  };
}

function getThemeSnapshot(): ThemeMode {
  return currentTheme;
}

function getServerThemeSnapshot(): ThemeMode {
  return "obsidian";
}

export function useTheme() {
  const theme: ThemeMode = useSyncExternalStore<ThemeMode>(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const effective = getEffectiveTheme(theme);

  const setTheme = (mode: ThemeMode) => {
    setThemeGlobal(mode);
  };

  return { theme, effective, setTheme, options: THEME_OPTIONS };
}
