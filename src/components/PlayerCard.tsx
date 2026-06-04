import { getPlayerSeasonLabel, getRoleColor } from "../lib/utils";
import type { Player } from "../types";

type PlayerCardProps = {
  player: Player;
  overall: number;
  capCost?: number;
  showCapCost?: boolean;
  selected?: boolean;
  muted?: boolean;
  franchiseId?: string;
  actionLabel?: string;
  onAction?: () => void;
  layout?: "card" | "row";
};

export function PlayerCard({
  player,
  overall,
  capCost,
  showCapCost = false,
  selected = false,
  muted = false,
  franchiseId,
  actionLabel,
  onAction,
  layout = "card",
}: PlayerCardProps) {
  const seasonLabel = getPlayerSeasonLabel(player, franchiseId);
  const isGoalie = player.primaryPosition === "G";
  const isRow = layout === "row";

  if (isRow) {
    return (
      <article
        className={`rounded-[1.3rem] border px-4 py-4 transition ${
          selected
            ? "border-ember/70 bg-ember/10 shadow-[0_0_0_1px_rgba(255,133,95,0.18)]"
            : "border-white/10 bg-[#141c2f] hover:border-white/20 hover:bg-[#18223a]"
        } ${muted ? "opacity-70" : ""}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3 lg:block">
              <div className="min-w-0">
                <h3 className="truncate font-display text-[1.7rem] uppercase tracking-[0.04em] text-white">
                  {player.name}
                </h3>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {seasonLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right lg:hidden">
                <div className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">OVR</div>
                <div className="font-display text-3xl text-white">{overall}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`text-xs uppercase tracking-[0.28em] ${getRoleColor(player.primaryPosition)}`}>
                {player.eligiblePositions.join(" • ")}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-ember">
                {player.roleTag}
              </span>
              {showCapCost ? (
                <span className="rounded-full border border-aurora/20 bg-aurora/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-aurora">
                  ${capCost}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right lg:block">
              <div className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">OVR</div>
              <div className="font-display text-3xl text-white">{overall}</div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-sm text-slate-200">
              {isGoalie ? (
                <>
                  <RowStat label="SV%" value={player.stats.savePct ? player.stats.savePct.toFixed(3) : "N/A"} />
                  <RowStat label="GAA" value={player.stats.gaa?.toFixed(2) ?? "N/A"} />
                  <RowStat label="W" value={player.stats.goalieWins ?? "N/A"} />
                  <RowStat label="SO" value={player.stats.shutouts ?? "N/A"} />
                </>
              ) : (
                <>
                  <RowStat label="G" value={player.stats.goals ?? "N/A"} />
                  <RowStat label="A" value={player.stats.assists ?? "N/A"} />
                  <RowStat label="PTS" value={player.stats.points ?? "N/A"} />
                  <RowStat label="+/-" value={player.stats.plusMinus ?? "Est."} />
                </>
              )}
            </div>
          </div>
        </div>

        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm uppercase tracking-[0.2em] transition ${
              selected
                ? "border-ember/40 bg-ember/20 text-white"
                : "border-white/10 bg-white/[0.08] text-white hover:bg-ember hover:text-ink"
            }`}
          >
            {actionLabel}
          </button>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={`rounded-[1.5rem] border p-4 transition ${
        selected
          ? "border-ice bg-ice/10 shadow-[0_0_0_1px_rgba(159,232,255,0.25),0_16px_40px_rgba(0,0,0,0.35)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
      } ${muted ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.28em] ${getRoleColor(player.primaryPosition)}`}>
            {player.primaryPosition}
          </p>
          <h3 className="mt-2 font-display text-2xl uppercase tracking-[0.08em] text-white">
            {player.name}
          </h3>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-300">
            {seasonLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right">
          <div className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">OVR</div>
          <div className="font-display text-3xl text-white">{overall}</div>
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-ember">
        {player.roleTag}
      </div>
      {showCapCost ? (
        <div className="mt-3 inline-flex rounded-full border border-aurora/20 bg-aurora/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-aurora">
          ${capCost}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
        {isGoalie ? (
          <>
            <Stat label="SV%" value={player.stats.savePct ? player.stats.savePct.toFixed(3) : "N/A"} />
            <Stat label="GAA" value={player.stats.gaa?.toFixed(2) ?? "N/A"} />
            <Stat label="W" value={player.stats.goalieWins ?? "N/A"} />
            <Stat label="SO" value={player.stats.shutouts ?? "N/A"} />
          </>
        ) : (
          <>
            <Stat label="G" value={player.stats.goals ?? "N/A"} />
            <Stat label="A" value={player.stats.assists ?? "N/A"} />
            <Stat label="PTS" value={player.stats.points ?? "N/A"} />
            <Stat label="+/-" value={player.stats.plusMinus ?? "Est."} />
          </>
        )}
      </div>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-ice hover:text-ink"
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
      <div className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function RowStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-[3.2rem] text-center">
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-slate-400">{label}</div>
    </div>
  );
}
