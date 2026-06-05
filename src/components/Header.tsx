import { SALARY_CAP } from "../lib/constants";
import type { GameMode, GameStatus } from "../types";

type HeaderProps = {
  seasonGames: number;
  gameMode: GameMode;
  salarySpent: number;
  isSampleDataset: boolean;
  status: GameStatus;
  draftedCount: number;
};

export function Header({
  seasonGames,
  gameMode,
  salarySpent,
  isSampleDataset,
  status,
  draftedCount,
}: HeaderProps) {
  const isDrafting = !["intro", "results"].includes(status);

  if (isDrafting) {
    return (
      <header className="rounded-[1.75rem] border border-white/10 bg-slate-950/65 px-4 py-4 shadow-glow sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] border border-ice/20 bg-white/5">
              <LogoMark compact />
            </div>
            <div>
              <p className="font-display text-lg uppercase tracking-[0.14em] text-white sm:text-xl">
                Puck Perfect
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                Round {Math.min(draftedCount + 1, 7)} of 7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white">
              Target {seasonGames}-0
            </div>
            {gameMode === "cap" ? (
              <div className="rounded-full border border-aurora/20 bg-aurora/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-aurora">
                ${salarySpent}/{SALARY_CAP}
              </div>
            ) : null}
            {isSampleDataset ? (
              <div className="hidden rounded-full border border-ember/20 bg-ember/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-ember sm:block">
                Sample pool
              </div>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-rink px-5 py-5 shadow-glow sm:px-6">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-ice/70 to-transparent" />
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-ice/20 bg-white/5 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-ice/80">
            <LogoMark />
            Original Hockey Draft Game
          </div>
          <div>
            <p className="font-display text-[clamp(2.75rem,7vw,4.45rem)] uppercase tracking-[0.16em] text-white">
              Puck Perfect
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
              Draft a six-player all-time lineup plus a head coach, chase {seasonGames}-0, and see if your hockey superteam can finish a perfect season{gameMode === "cap" ? ` under the $${SALARY_CAP} cap` : ""}.
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2 md:min-w-[15rem]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[0.7rem] uppercase tracking-[0.25em] text-ice/75">Target</div>
            <div className="mt-1 font-display text-2xl text-white">{seasonGames}-0</div>
          </div>
          {gameMode === "cap" ? (
            <div className="rounded-2xl border border-aurora/15 bg-aurora/8 p-3">
              <div className="text-[0.7rem] uppercase tracking-[0.25em] text-ice/75">Cap</div>
              <div className="mt-1 font-display text-xl text-white">${SALARY_CAP}</div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-[0.7rem] uppercase tracking-[0.25em] text-ice/75">Roster</div>
              <div className="mt-1 font-display text-xl text-white">
                {isSampleDataset ? "Sample" : "Expanded"}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={compact ? "h-7 w-7" : "h-5 w-5"}
      viewBox="0 0 48 48"
      fill="none"
    >
      <circle cx="18" cy="16" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        d="M24 22L38 36"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M10 33H26"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
