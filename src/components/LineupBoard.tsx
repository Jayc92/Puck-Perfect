import { LINEUP_SLOTS } from "../lib/constants";
import { getPlayerById } from "../lib/utils";
import { PositionSlot } from "./PositionSlot";
import type { Coach, LineupAssignment, LineupSlotId, Player } from "../types";

type LineupBoardProps = {
  lineup: LineupAssignment;
  players: Player[];
  selectedPlayer: Player | null;
  pendingSlots: LineupSlotId[];
  playerRatings: Partial<Record<LineupSlotId, number>>;
  coach: Coach | null;
  coachOverall?: number;
  coachPending: boolean;
  onSlotSelect?: (slot: LineupSlotId) => void;
};

export function LineupBoard({
  lineup,
  players,
  selectedPlayer,
  pendingSlots,
  playerRatings,
  coach,
  coachOverall,
  coachPending,
  onSlotSelect,
}: LineupBoardProps) {
  const rinkPositions: Record<LineupSlotId, string> = {
    LW: "left-[18%] top-[27%] -translate-x-1/2 -translate-y-1/2",
    C: "left-1/2 top-[49.5%] -translate-x-1/2 -translate-y-1/2",
    RW: "left-[82%] top-[27%] -translate-x-1/2 -translate-y-1/2",
    D1: "left-[18%] top-[72%] -translate-x-1/2 -translate-y-1/2",
    D2: "left-[82%] top-[72%] -translate-x-1/2 -translate-y-1/2",
    G: "left-1/2 top-[88%] -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ice/70">Starting Six</p>
          <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.12em] text-white">
            Build your lineup
          </h2>
        </div>
        {selectedPlayer ? (
          <div className="rounded-full border border-aurora/35 bg-aurora/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-aurora">
            Place {selectedPlayer.name}
          </div>
        ) : coachPending ? (
          <div className="rounded-full border border-ice/35 bg-ice/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-ice">
            Coach round first
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-[2rem] border border-white/10 bg-slate-950/35 p-3 sm:p-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(116,206,255,0.16),transparent_26%),radial-gradient(circle_at_50%_72%,rgba(82,144,255,0.12),transparent_34%),linear-gradient(180deg,rgba(18,40,74,0.98),rgba(7,19,39,0.99))]">
          <div className="absolute inset-[5%] rounded-[2rem] border-2 border-white/80" />
          <div className="absolute left-1/2 top-[5%] h-[90%] w-[3px] -translate-x-1/2 bg-red-300/65" />
          <div className="absolute left-[34%] top-[5%] h-[90%] w-[3px] -translate-x-1/2 bg-sky-400/80" />
          <div className="absolute left-[66%] top-[5%] h-[90%] w-[3px] -translate-x-1/2 bg-sky-400/80" />
          <div className="absolute left-1/2 top-1/2 h-[17%] w-[17%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-300/60" />
          <div className="absolute left-1/2 top-1/2 h-[3px] w-[11%] -translate-x-1/2 -translate-y-1/2 bg-red-300/55" />
          <div className="absolute left-[18%] top-[27%] h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-300/45" />
          <div className="absolute left-[82%] top-[27%] h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-300/45" />
          <div className="absolute left-[18%] top-[72%] h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-300/45" />
          <div className="absolute left-[82%] top-[72%] h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-300/45" />
          <div className="absolute left-[5%] top-1/2 h-[8%] w-[3.5%] -translate-y-1/2 rounded-r-full border border-red-300/45 bg-sky-300/10" />
          <div className="absolute right-[5%] top-1/2 h-[8%] w-[3.5%] -translate-y-1/2 rounded-l-full border border-red-300/45 bg-sky-300/10" />
          <div className="absolute inset-x-[5%] bottom-[9.5%] h-[2px] bg-red-300/55" />
          <div className="absolute left-1/2 bottom-[5%] h-[11.5%] w-[23%] -translate-x-1/2 rounded-t-[999px] border-2 border-red-300/40 border-b-0" />
          <div className="absolute left-[18%] bottom-[23%] h-[4px] w-[1.1%] -translate-x-1/2 rounded-full bg-red-300/70" />
          <div className="absolute left-[82%] bottom-[23%] h-[4px] w-[1.1%] -translate-x-1/2 rounded-full bg-red-300/70" />
          <div className="absolute left-[40%] top-1/2 h-[4px] w-[1.1%] -translate-x-1/2 rounded-full bg-red-300/70" />
          <div className="absolute left-[60%] top-1/2 h-[4px] w-[1.1%] -translate-x-1/2 rounded-full bg-red-300/70" />
          <div className="absolute left-1/2 bottom-[6.1%] h-[4.8%] w-[10.5%] -translate-x-1/2 rounded-t-[999px] border-2 border-cyan-300/70 border-b-0 bg-cyan-300/12" />
          <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.018)_24%,transparent_50%,rgba(255,255,255,0.018)_76%,transparent)]" />

          {LINEUP_SLOTS.map((slot) => {
            const player = getPlayerById(players, lineup[slot]);
            const isEligible = pendingSlots.includes(slot);

            return (
              <div key={slot} className={`absolute ${rinkPositions[slot]}`}>
                <PositionSlot
                  slot={slot}
                  player={player}
                  overall={playerRatings[slot]}
                  isEligible={isEligible}
                  isSelected={Boolean(selectedPlayer && isEligible)}
                  onClick={isEligible && onSlotSelect ? () => onSlotSelect(slot) : undefined}
                  compact
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        {selectedPlayer ? (
          <div className="rounded-[1.2rem] border border-ember/25 bg-ember/12 px-4 py-4 text-center text-sm uppercase tracking-[0.18em] text-ember">
            Tap one of the highlighted slots to place {selectedPlayer.name}
          </div>
        ) : coachPending ? (
          <div className="rounded-[1.2rem] border border-ice/20 bg-ice/10 px-4 py-4 text-center text-sm uppercase tracking-[0.18em] text-ice">
            Hire your head coach first, then start filling the six on-ice slots.
          </div>
        ) : (
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm uppercase tracking-[0.18em] text-slate-300">
            Your starting six will lock the season simulation once every slot is filled
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-slate-950/40 p-4">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Bench Boss</div>
        {coach ? (
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-display text-2xl uppercase tracking-[0.06em] text-white">
                {coach.name}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-aurora">
                {coach.roleTag}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right">
              <div className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400">OVR</div>
              <div className="font-display text-2xl text-white">{coachOverall ?? "--"}</div>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-300">
            {coachPending
              ? "Choose a head coach from the first franchise-era prompt to launch the build."
              : "Your coach stays locked here while you build out the six on-ice slots."}
          </div>
        )}
      </div>
    </section>
  );
}
