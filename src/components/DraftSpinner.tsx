import { useEffect, useMemo, useState } from "react";
import type { DraftPrompt } from "../types";

type DraftSpinnerProps = {
  status: "intro" | "ready" | "spinning" | "choosingPlayer" | "assigningSlot" | "complete" | "results";
  prompt: DraftPrompt | null;
  onSpin: () => void;
  canSpin: boolean;
  spinFranchiseNames: string[];
  spinEras: string[];
};

export function DraftSpinner({
  status,
  prompt,
  onSpin,
  canSpin,
  spinFranchiseNames,
  spinEras,
}: DraftSpinnerProps) {
  const isSpinning = status === "spinning";
  const [spinFrame, setSpinFrame] = useState(0);

  useEffect(() => {
    if (!isSpinning) {
      setSpinFrame(0);
      return;
    }

    const interval = window.setInterval(() => {
      setSpinFrame((frame) => frame + 1);
    }, 120);

    return () => window.clearInterval(interval);
  }, [isSpinning]);

  const fallbackFranchises = useMemo(
    () => (spinFranchiseNames.length ? spinFranchiseNames : ["Detroit", "Montreal", "Boston", "Chicago", "Colorado"]),
    [spinFranchiseNames],
  );
  const fallbackEras = useMemo(
    () => (spinEras.length ? spinEras : ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]),
    [spinEras],
  );

  const spinningTeamLabel = fallbackFranchises[spinFrame % fallbackFranchises.length];
  const spinningEraLabel = fallbackEras[(spinFrame * 2) % fallbackEras.length];

  const teamLabel = isSpinning ? spinningTeamLabel : prompt?.franchiseName ?? "Team";
  const eraLabel = isSpinning ? spinningEraLabel : prompt?.decadeTag ?? "Era";
  const canStartSpin = canSpin && status === "ready" && !prompt;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ice/70">Draft Board</p>
          <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.12em] text-white">
            {isSpinning
              ? "Scanning eras..."
              : prompt
                ? "Draft an eligible player"
                : "Ready for the opening spin"}
          </h2>
          <p className="mt-2 text-sm text-slate-200">
            {isSpinning
              ? "The board is rerolling until it finds a franchise-era pool with enough eligible talent."
              : prompt
                ? "Pick the strongest fit from the revealed franchise and era, then confirm the choice to lock it into your lineup."
                : "Spin to reveal a franchise and decade, then draft a legend from that historical pool."}
          </p>
        </div>

        {canStartSpin ? (
          <button
            type="button"
            onClick={onSpin}
            disabled={isSpinning}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-ice via-aurora to-ember bg-[length:200%_200%] px-5 py-3 font-display text-sm uppercase tracking-[0.22em] text-ink transition hover:animate-shimmer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Spin Board
          </button>
        ) : prompt ? (
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.22em] text-slate-300">
            Pick a player to keep the run alive
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <ReelCard
            label="Team"
            value={teamLabel}
            accent="from-ember/90 to-[#ffb000]"
            active={Boolean(prompt)}
            spinning={isSpinning}
          />
          <ReelCard
            label="Era"
            value={eraLabel}
            accent="from-[#9547ff] to-[#dd7dff]"
            active={Boolean(prompt)}
            spinning={isSpinning}
          />
        </div>

        {isSpinning ? (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-1/3 animate-[shimmer_1s_linear_infinite] rounded-full bg-gradient-to-r from-transparent via-ice to-transparent bg-[length:200%_100%]" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReelCard({
  label,
  value,
  accent,
  active,
  spinning,
}: {
  label: string;
  value: string;
  accent: string;
  active: boolean;
  spinning: boolean;
}) {
  return (
    <div className={`rounded-[1.45rem] bg-gradient-to-br p-[3px] ${active || spinning ? accent : "from-white/10 to-white/10"}`}>
      <div className="rounded-[1.3rem] border border-white/10 bg-[#121b2f] px-4 py-5 text-center">
        <div className="text-[0.68rem] uppercase tracking-[0.34em] text-slate-400">{label}</div>
        <div className="mt-3 min-h-[3rem] overflow-hidden">
          <div
            key={value}
            className={`font-display text-4xl uppercase tracking-[0.1em] leading-none text-white ${spinning ? "animate-pulseSpin" : ""}`}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
