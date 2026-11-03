import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setMuted, unlockAudio } from "@/lib/audio";
import { loadJSON, saveJSON } from "@/lib/storage";

export type ThemeChoice = "light" | "dark" | "system";

export interface Settings {
  version: 1;
  theme: ThemeChoice;
  conflicts: boolean;
  colorblind: boolean;
  muted: boolean;
  tutorialSeen: boolean;
  /** First-game offer has been accepted or dismissed. */
  guideOffered: boolean;
}

const KEY = "ccs.settings";

export const defaultSettings: Settings = {
  version: 1,
  theme: "system",
  conflicts: true,
  colorblind: false,
  muted: false,
  tutorialSeen: false,
  guideOffered: false,
};

function normalize(raw: Partial<Settings> | null): Settings {
  if (!raw || raw.version !== 1) return defaultSettings;
  return { ...defaultSettings, ...raw, version: 1 };
}

export function applyTheme(theme: ThemeChoice): void {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#10211c" : "#f6f0e6");
}

interface SettingsApi {
  settings: Settings;
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
}

const Ctx = createContext<SettingsApi | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = normalize(loadJSON<Settings>(KEY));
    setSettings(loaded);
    applyTheme(loaded.theme);
    setMuted(loaded.muted);
    setReady(true);
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveJSON(KEY, settings);
    applyTheme(settings.theme);
    setMuted(settings.muted);
  }, [ready, settings]);

  useEffect(() => {
    if (!ready || settings.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [ready, settings.theme]);

  const api = useMemo<SettingsApi>(
    () => ({
      settings,
      ready,
      update: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
    }),
    [ready, settings],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Settings are only available inside the app shell");
  return ctx;
}
