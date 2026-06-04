import { EMPTY_LINEUP, LINEUP_SLOTS, SLOT_POSITION_MAP } from "./constants";
import { getEligibleLineupSlots, getPlayerById, getPromptPools, getOpenSlots, randomInt, shuffleWithState } from "./utils";
import type { DraftPrompt, Franchise, LineupAssignment, Player } from "../types";

type PromptBuildResult = {
  prompt: DraftPrompt | null;
  rngState: number;
};

export const getPromptKey = (prompt: Pick<DraftPrompt, "franchiseId" | "decadeTag"> | null) =>
  prompt ? `${prompt.franchiseId}:${prompt.decadeTag}` : null;

export const createInitialLineup = (): LineupAssignment => ({ ...EMPTY_LINEUP });

export const isLineupComplete = (lineup: LineupAssignment) =>
  LINEUP_SLOTS.every((slot) => Boolean(lineup[slot]));

export const buildDraftPrompt = (
  players: Player[],
  franchises: Franchise[],
  lineup: LineupAssignment,
  draftedPlayerIds: string[],
  rngState: number,
  lastPromptKey: string | null = null,
): PromptBuildResult => {
  const openSlots = getOpenSlots(lineup);
  const allPools = getPromptPools(players, franchises)
    .map((pool) => {
      const eligible = pool.playerIds
        .map((playerId) => getPlayerById(players, playerId))
        .filter((player): player is Player => Boolean(player))
        .filter(
          (player) =>
            !draftedPlayerIds.includes(player.id) &&
            getEligibleLineupSlots(player, lineup).length > 0,
        );

      return {
        pool,
        eligible,
      };
    })
    .filter(({ eligible }) => eligible.length >= 3)
    .filter(({ eligible }) => {
      const availablePositions = new Set(
        eligible.flatMap((player) => player.eligiblePositions),
      );

      return openSlots.some((slot) => availablePositions.has(SLOT_POSITION_MAP[slot]));
    });

  const pools =
    lastPromptKey && allPools.length > 1
      ? allPools.filter(({ pool }) => getPromptKey(pool) !== lastPromptKey)
      : allPools;

  if (!pools.length) {
    return { prompt: null, rngState };
  }

  const pickPool = randomInt(rngState, pools.length);
  const selectedPool = pools[pickPool.index];
  const shuffled = shuffleWithState(selectedPool.eligible, pickPool.nextState);

  return {
    rngState: shuffled.nextState,
    prompt: {
      ...selectedPool.pool,
      playerIds: shuffled.items.map((player) => player.id),
    },
  };
};

export const assignPlayerToSlot = (
  lineup: LineupAssignment,
  slot: keyof LineupAssignment,
  playerId: string,
) => ({
  ...lineup,
  [slot]: playerId,
});

export const getAutoAssignSlot = (
  player: Player,
  lineup: LineupAssignment,
) => getEligibleLineupSlots(player, lineup)[0] ?? null;

export const parseShareCode = (value: string): { seasonGames: 82 | 84; lineup: LineupAssignment } | null => {
  const compactMatch = value.split("~");
  if (compactMatch.length === 1 + LINEUP_SLOTS.length) {
    const seasonGames = Number(compactMatch[0]);
    if (seasonGames === 82 || seasonGames === 84) {
      const lineup = createInitialLineup();
      LINEUP_SLOTS.forEach((slot, index) => {
        const playerId = compactMatch[index + 1];
        lineup[slot] = playerId === "open" ? null : playerId;
      });
      return { seasonGames, lineup };
    }
  }

  const parts = value.split(";").reduce<Record<string, string>>((result, part) => {
    const [key, entry] = part.split("=");
    if (key && entry) {
      result[key] = entry;
    }
    return result;
  }, {});

  const seasonGames = Number(parts.season);
  if (seasonGames !== 82 && seasonGames !== 84) {
    return null;
  }

  const lineup = createInitialLineup();
  const lineupEntries = parts.lineup?.split(",") ?? [];
  lineupEntries.forEach((entry) => {
    const [slot, playerId] = entry.split(":");
    if (slot && slot in lineup) {
      lineup[slot as keyof LineupAssignment] = playerId === "open" ? null : playerId;
    }
  });

  return { seasonGames, lineup };
};
