import { SALARY_CAP } from "../lib/constants";
import { getResultSummary } from "../lib/scoring";
import { getCoachById, getPlayerById, getPlayerSeasonLabel } from "../lib/utils";
import { ShareButton } from "./ShareButton";
import type { Coach, LineupAssignment, Player, SeasonResult } from "../types";

type ResultPanelProps = {
  result: SeasonResult;
  lineup: LineupAssignment;
  players: Player[];
  coaches: Coach[];
  coachId: string | null;
  salarySpent: number;
  shareUrl: string;
  onNewDraft: () => void;
};

export function ResultPanel({
  result,
  lineup,
  players,
  coaches,
  coachId,
  salarySpent,
  shareUrl,
  onNewDraft,
}: ResultPanelProps) {
  const summary = getResultSummary(result, lineup, players, coachId, coaches);
  const coach = getCoachById(coaches, coachId);

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-4 shadow-glow sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ice/70">Projected Record</p>
          <h2 className="mt-1.5 font-display text-[clamp(3.6rem,8vw,5.75rem)] uppercase tracking-[0.08em] text-white">
            {result.wins}-{result.losses}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="font-display text-2xl text-aurora">{result.grade}</span>
            <span className="text-base font-semibold uppercase tracking-[0.12em] text-aurora">
              {getDynastyLabel(result.teamRating)}
            </span>
            <span className="text-sm text-slate-300">• {result.teamRating} pts</span>
          </div>
          <p className="mt-2.5 max-w-3xl text-sm leading-6 text-slate-200">
            {result.explanation}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <Metric label="Grade" value={result.grade} />
          <Metric label="Team Rating" value={result.teamRating} />
          <Metric label="Avg Win Odds" value={`${result.averageWinProbability}%`} />
          {result.gameMode === "cap" ? (
            <Metric label="Cap Used" value={`$${salarySpent}/${SALARY_CAP}`} />
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <ShareButton
          summary={summary}
          shareUrl={shareUrl}
          result={result}
          lineup={lineup}
          players={players}
          coach={coach}
        />
        <button
          type="button"
          onClick={onNewDraft}
          className="rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
        >
          Build Another
        </button>
      </div>

      <div className="mt-5 space-y-3">
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

        {coach ? (
          <div className="grid gap-4 rounded-[1.3rem] border border-white/10 bg-slate-950/55 p-3.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[1rem] bg-gradient-to-br from-aurora/30 to-ice/20 font-display text-base uppercase tracking-[0.08em] text-white">
                HC
              </div>
              <div>
                <div className="font-display text-xl uppercase tracking-[0.04em] text-white">
                  {coach.name}
                </div>
                <div className="mt-1 text-sm uppercase tracking-[0.12em] text-slate-300">
                  {coach.roleTag}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-slate-200">
              <StatCell label="WINS" value={coach.stats.wins} />
              <StatCell label="WIN%" value={coach.stats.winPct.toFixed(3)} />
              <StatCell label="CUPS" value={coach.stats.cups} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.3rem] border border-white/10 bg-slate-950/60 p-4">
          <h3 className="font-display text-lg uppercase tracking-[0.12em] text-white">Strengths</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
            {result.strengths.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.3rem] border border-white/10 bg-slate-950/60 p-4">
          <h3 className="font-display text-lg uppercase tracking-[0.12em] text-white">Weaknesses</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
            {result.weaknesses.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-[1.3rem] border border-ice/15 bg-ice/8 p-4 text-sm leading-6 text-slate-100">
        <div className="text-xs uppercase tracking-[0.3em] text-ice/75">How Rating Works</div>
        <p className="mt-3">
          Forwards are 36% of the final score, defense 20%, goalie 20%, coach 6%, and fit plus chemistry 18%. Skater overalls now start from decade-specific points bands, then separate further with points per game, games played, a slight goals-over-assists edge, and small trophy bumps.
        </p>
        <p className="mt-2 text-slate-300">
          Goalie grades still lean wins first, then save percentage, awards, GAA, and shutouts. Some older defensive inputs are still estimated conservatively when historical stat coverage is incomplete.
        </p>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-slate-950/65 p-3.5">
      <div className="text-[0.7rem] uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className="mt-1.5 font-display text-[1.8rem] text-white">{value}</div>
    </div>
  );
}

function PlayerResultRow({ slot, player }: { slot: string; player: Player }) {
  const isGoalie = player.primaryPosition === "G";
  const games = Math.max(player.stats.games, 1);
  const badge = `${slot}`;

  return (
    <div className="grid gap-4 rounded-[1.3rem] border border-white/10 bg-slate-950/55 p-3.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[1rem] bg-gradient-to-br from-ice/30 to-aurora/20 font-display text-base uppercase tracking-[0.08em] text-white">
          {badge}
        </div>
        <div>
          <div className="font-display text-xl uppercase tracking-[0.04em] text-white">
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
