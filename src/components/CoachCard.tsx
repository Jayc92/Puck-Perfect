import { getCoachSeasonLabel } from "../lib/utils";
import type { Coach } from "../types";

type CoachCardProps = {
  coach: Coach;
  overall: number;
  selected?: boolean;
  muted?: boolean;
  franchiseId?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function CoachCard({
  coach,
  overall,
  selected = false,
  muted = false,
  franchiseId,
  actionLabel,
  onAction,
}: CoachCardProps) {
  const seasonLabel = getCoachSeasonLabel(coach, franchiseId);

  return (
    <article
      className={`rounded-[1.3rem] border px-4 py-4 transition ${
        selected
          ? "border-aurora/70 bg-aurora/10 shadow-[0_0_0_1px_rgba(126,244,224,0.18)]"
          : "border-white/10 bg-[#141c2f] hover:border-white/20 hover:bg-[#18223a]"
      } ${muted ? "opacity-70" : ""}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3 lg:block">
            <div className="min-w-0">
              <h3 className="truncate font-display text-[1.7rem] uppercase tracking-[0.04em] text-white">
                {coach.name}
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
            <span className="text-xs uppercase tracking-[0.28em] text-ice">HC</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-aurora">
              {coach.roleTag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right lg:block">
            <div className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">OVR</div>
            <div className="font-display text-3xl text-white">{overall}</div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm text-slate-200">
            <RowStat label="WINS" value={coach.stats.wins} />
            <RowStat label="WIN%" value={coach.stats.winPct.toFixed(3)} />
            <RowStat label="CUPS" value={coach.stats.cups} />
          </div>
        </div>
      </div>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm uppercase tracking-[0.2em] transition ${
            selected
              ? "border-aurora/40 bg-aurora/20 text-white"
              : "border-white/10 bg-white/[0.08] text-white hover:bg-aurora hover:text-ink"
          }`}
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

function RowStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-[4.4rem] text-center">
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-slate-400">{label}</div>
    </div>
  );
}
