import { SEASON_OPTIONS } from "../lib/constants";

type SeasonLengthToggleProps = {
  value: 82 | 84;
  onChange: (value: 82 | 84) => void;
};

export function SeasonLengthToggle({ value, onChange }: SeasonLengthToggleProps) {
  return (
    <div
      className="inline-flex rounded-full border border-white/10 bg-white/5 p-1"
      role="group"
      aria-label="Season target"
    >
      {SEASON_OPTIONS.map((option) => {
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
            {option} games
          </button>
        );
      })}
    </div>
  );
}
