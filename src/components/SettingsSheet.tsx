import { Eye, HelpCircle, Moon, Sun, Volume2, VolumeX, X } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ThemeChoice } from "./settings";
import { useSettings } from "./settings";

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export function SettingsSheet({
  open,
  onClose,
  onTutorial,
  onGuide,
}: {
  open: boolean;
  onClose: () => void;
  onTutorial: () => void;
  onGuide?: () => void;
}) {
  const { settings, update } = useSettings();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-labelledby="settings-title"
        className="w-full max-w-md rounded-3xl bg-card p-5 text-ink shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="settings-title" className="font-display text-2xl font-semibold">
            Table settings
          </h2>
          <button type="button" aria-label="Close settings" onClick={onClose} className="rounded-full p-2 active:scale-[0.96]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-sm font-medium text-ink-soft">Theme</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              aria-pressed={settings.theme === theme.id}
              onClick={() => update({ theme: theme.id })}
              className={cn(
                "flex h-12 items-center justify-center gap-1 rounded-2xl border text-sm font-semibold active:scale-[0.96]",
                settings.theme === theme.id ? "border-ink bg-ink text-felt" : "border-line bg-well",
              )}
            >
              {theme.id === "light" ? <Sun className="h-4 w-4" /> : theme.id === "dark" ? <Moon className="h-4 w-4" /> : null}
              {theme.label}
            </button>
          ))}
        </div>

        <Toggle
          label="Conflict glow"
          detail="Red rings when a rule breaks. Turn off for a harder table."
          on={settings.conflicts}
          onClick={() => update({ conflicts: !settings.conflicts })}
          icon={<Eye className="h-4 w-4" />}
        />
        <Toggle
          label="Color symbols"
          detail="Diamond, star, circle, triangle — so color is never the only clue."
          on={settings.colorblind}
          onClick={() => update({ colorblind: !settings.colorblind })}
          icon={<span className="text-sm leading-none">◆</span>}
        />
        <Toggle
          label={settings.muted ? "Sound off" : "Sound on"}
          detail="Card flips, a buzz for clashes, a little fanfare for UNO."
          on={!settings.muted}
          onClick={() => update({ muted: !settings.muted })}
          icon={settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        />

        <button
          type="button"
          onClick={onTutorial}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-well font-semibold active:scale-[0.96]"
        >
          <HelpCircle className="h-4 w-4" />
          How to play
        </button>
        {onGuide ? (
          <button
            type="button"
            onClick={onGuide}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-accent-ink active:scale-[0.96]"
          >
            Walk through a game
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Toggle({
  label,
  detail,
  on,
  onClick,
  icon,
}: {
  label: string;
  detail: string;
  on: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-line bg-well px-3 py-3 text-left active:scale-[0.96]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-ink-soft">{detail}</span>
      </span>
      <span className={cn("h-7 w-12 rounded-full p-1", on ? "bg-table" : "bg-line")}>
        <span className={cn("block h-5 w-5 rounded-full bg-cream transition-transform", on && "translate-x-5")} />
      </span>
    </button>
  );
}
