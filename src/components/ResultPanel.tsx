import { getResultSummary } from "../lib/scoring";
import { getPlayerById, getPlayerSeasonLabel } from "../lib/utils";
import { ShareButton } from "./ShareButton";
import type { LineupAssignment, Player, SeasonResult } from "../types";

type ResultPanelProps = {
  result: SeasonResult;
  lineup: LineupAssignment;
  players: Player[];
  shareUrl: string;
  onNewDraft: () => void;
};

export function ResultPanel({
  result,
  lineup,
  players,
  shareUrl,
  onNewDraft,
}: ResultPanelProps) {
  const summary = getResultSummary(result, lineup, players);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-5 shadow-glow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ice/70">Projected Record</p>
          <h2 className="mt-2 font-display text-6xl uppercase tracking-[0.08em] text-white sm:text-7xl">
            {result.wins}-{result.losses}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-display text-3xl text-aurora">{result.grade}</span>
            <span className="text-lg font-semibold uppercase tracking-[0.12em] text-aurora">
              {getDynastyLabel(result.teamRating)}
            </span>
            <span className="text-sm text-slate-300">• {result.teamRating} pts</span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            {result.explanation}
          </p>
        </div>

        <div className="grid min-w-[220px] gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Metric label="Grade" value={result.grade} />
          <Metric label="Team Rating" value={result.teamRating} />
          <Metric label="Avg Win Odds" value={`${result.averageWinProbability}%`} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <ShareButton
          summary={summary}
          shareUrl={shareUrl}
          result={result}
          lineup={lineup}
          players={players}
        />
        <button
          type="button"
          onClick={onNewDraft}
          className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
        >
          Build Another
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {Object.entries(lineup).map(([slot, playerId]) => {
          const player = getPlayerById(players, playerId);
          if (!player) {
            return null;
          }

          return (
            <PlayerResultRow
              key={slot}
              slot={slot}
              player={player}
            />
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
          <h3 className="font-display text-xl uppercase tracking-[0.12em] text-white">Strengths</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
            {result.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
          <h3 className="font-display text-xl uppercase tracking-[0.12em] text-white">Weaknesses</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
            {result.weaknesses.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-ice/15 bg-ice/8 p-4 text-sm leading-6 text-slate-100">
        <div className="text-xs uppercase tracking-[0.3em] text-ice/75">How Rating Works</div>
        <p className="mt-3">
          Forwards are 41% of the final score, defense 26%, goalie 23%, and fit plus chemistry 10%. Offensive rates, defensive estimates, awards bonuses, and era normalization all feed the player grades, while balance across the lineup matters more than stacking six scorers.
        </p>
        <p className="mt-2 text-slate-300">
          Some older defensive inputs are estimated conservatively when historical stat coverage is incomplete.
        </p>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
      <div className="text-[0.7rem] uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className="mt-2 font-display text-3xl text-white">{value}</div>
    </div>
  );
}

function PlayerResultRow({ slot, player }: { slot: string; player: Player }) {
  const isGoalie = player.primaryPosition === "G";
  const games = Math.max(player.stats.games, 1);
  const badge = `${slot}`;

  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-ice/30 to-aurora/20 font-display text-lg uppercase tracking-[0.08em] text-white">
          {badge}
        </div>
        <div>
          <div className="font-display text-2xl uppercase tracking-[0.04em] text-white">
            {player.name}
          </div>
          <div className="mt-1 text-sm uppercase tracking-[0.12em] text-slate-300">
            {getPlayerSeasonLabel(player)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-sm text-slate-200">
        {isGoalie ? (
          <>
            <StatCell label="SV%" value={player.stats.savePct?.toFixed(3) ?? "N/A"} />
            <StatCell label="GAA" value={player.stats.gaa?.toFixed(2) ?? "N/A"} />
            <StatCell label="W" value={player.stats.goalieWins ?? "N/A"} />
            <StatCell label="SO" value={player.stats.shutouts ?? "N/A"} />
          </>
        ) : (
          <>
            <StatCell label="G/GP" value={((player.stats.goals ?? 0) / games).toFixed(2)} />
            <StatCell label="A/GP" value={((player.stats.assists ?? 0) / games).toFixed(2)} />
            <StatCell label="P/GP" value={((player.stats.points ?? 0) / games).toFixed(2)} />
            <StatCell label="+/-" value={player.stats.plusMinus ?? "Est."} />
          </>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function getDynastyLabel(teamRating: number) {
  if (teamRating >= 95) {
    return "Dynasty";
  }
  if (teamRating >= 89) {
    return "Juggernaut";
  }
  if (teamRating >= 82) {
    return "Contender";
  }
  if (teamRating >= 74) {
    return "Playoff Team";
  }
  return "Long Shot";
}
