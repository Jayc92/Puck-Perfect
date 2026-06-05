import { LINEUP_SLOTS } from "../lib/constants";
import { getPlayerById } from "../lib/utils";
import { HalfRink } from "./HalfRink";
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
    LW: "left-[28%] top-[45%] -translate-x-1/2 -translate-y-1/2",
    C: "left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2",
    RW: "left-[72%] top-[45%] -translate-x-1/2 -translate-y-1/2",
    D1: "left-[31%] top-[22%] -translate-x-1/2 -translate-y-1/2",
    D2: "left-[69%] top-[22%] -translate-x-1/2 -translate-y-1/2",
    G: "left-1/2 top-[84.5%] -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <section className="rounded-[1.8rem] border border-white/12 bg-white/[0.045] p-4 shadow-glow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ice/70">Starting Six</p>
          <h2 className="mt-1.5 font-display text-[clamp(1.65rem,2.7vw,2.05rem)] uppercase tracking-[0.12em] text-white">
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

      <div className="mt-4 rounded-[1.7rem] border border-white/10 bg-slate-950/35 p-3">
        <div className="relative aspect-[10/11] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#d8e2ea]">
          <HalfRink />

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

      <div className="mt-3">
        {selectedPlayer ? (
          <div className="rounded-[1.15rem] border border-ember/25 bg-ember/12 px-4 py-3 text-center text-sm uppercase tracking-[0.18em] text-ember">
            Tap one of the highlighted slots to place {selectedPlayer.name}
          </div>
        ) : coachPending ? (
          <div className="rounded-[1.15rem] border border-ice/20 bg-ice/10 px-4 py-3 text-center text-sm uppercase tracking-[0.18em] text-ice">
            Hire your head coach first, then start filling the six on-ice slots.
          </div>
        ) : (
          <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm uppercase tracking-[0.18em] text-slate-300">
            Your starting six will lock the season simulation once every slot is filled
          </div>
        )}
      </div>

      <div className="mt-3 rounded-[1.2rem] border border-white/10 bg-slate-950/40 p-4">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Bench Boss</div>
        {coach ? (
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-display text-[1.55rem] uppercase tracking-[0.06em] text-white">
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
