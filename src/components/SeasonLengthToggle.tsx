import { GAME_MODE_OPTIONS } from "../lib/constants";
import type { GameMode } from "../types";

type SeasonLengthToggleProps = {
  value: GameMode;
  onChange: (value: GameMode) => void;
};

export function SeasonLengthToggle({ value, onChange }: SeasonLengthToggleProps) {
  return (
    <div
      className="inline-flex rounded-full border border-white/10 bg-white/5 p-1"
      role="group"
      aria-label="Season target"
    >
      {GAME_MODE_OPTIONS.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              active
                ? "bg-ice text-ink shadow-lg shadow-ice/20"
                : "text-slate-200 hover:bg-white/10"
            }`}
            aria-pressed={active}
          >
            {option === "cap" ? "84-0 cap" : "84-0 open"}
          </button>
        );
      })}
    </div>
  );
}
