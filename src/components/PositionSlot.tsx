import { getRoleColor } from "../lib/utils";
import type { LineupSlotId, Player } from "../types";

type PositionSlotProps = {
  slot: LineupSlotId;
  player: Player | null;
  overall?: number;
  isEligible: boolean;
  isSelected: boolean;
  onClick?: () => void;
  compact?: boolean;
};

export function PositionSlot({
  slot,
  player,
  overall,
  isEligible,
  isSelected,
  onClick,
  compact = false,
}: PositionSlotProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        aria-label={player ? `${slot} assigned to ${player.name}` : `${slot} empty`}
        className={`flex h-[4.35rem] w-[4.35rem] flex-col items-center justify-center text-center transition sm:h-[4.8rem] sm:w-[4.8rem] ${
          player
            ? "text-white"
            : isSelected
              ? "text-ember"
              : isEligible
                ? "text-aurora"
                : "text-white"
        }`}
      >
        <div className={`text-xs uppercase tracking-[0.24em] ${getRoleColor(slot.startsWith("D") ? "D" : (slot as "LW" | "C" | "RW" | "G"))}`}>
          {slot}
        </div>
        <div className="mt-1 px-1 font-display text-[1.1rem] uppercase tracking-[0.06em] text-white sm:mt-1.5 sm:text-[1.25rem]">
          {player ? getCompactPlayerLabel(player.name) : slot}
        </div>
        {player ? (
          <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-300">
            {overall ?? "--"}
          </div>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={player ? `${slot} assigned to ${player.name}` : `${slot} empty`}
      className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
        isSelected
          ? "border-ice bg-ice/12"
          : isEligible
            ? "border-aurora/40 bg-aurora/10 hover:border-aurora/70"
            : "border-white/10 bg-white/5 hover:border-white/20"
      } ${!onClick ? "cursor-default" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-xs uppercase tracking-[0.28em] ${getRoleColor(slot.startsWith("D") ? "D" : (slot as "LW" | "C" | "RW" | "G"))}`}>
            {slot}
          </div>
          <div className="mt-2 font-display text-xl uppercase tracking-[0.08em] text-white">
            {player ? player.name : "Open Slot"}
          </div>
          <div className="mt-1 text-sm text-slate-300">
            {player ? `${player.primaryPosition} • ${player.roleTag}` : "Waiting for a draft pick"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right">
          <div className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400">OVR</div>
          <div className="font-display text-2xl text-white">{overall ?? "--"}</div>
        </div>
      </div>

      {isEligible ? (
        <div className="mt-4 rounded-xl border border-aurora/30 bg-aurora/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-aurora">
          Eligible assignment
        </div>
      ) : null}
    </button>
  );
}

function getCompactPlayerLabel(name: string) {
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].slice(0, 8);
  }
  const lastName = parts[parts.length - 1] ?? "";
  return lastName.slice(0, 7);
}
