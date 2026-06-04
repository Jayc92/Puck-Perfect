import { EMPTY_LINEUP, LINEUP_SLOTS, SLOT_POSITION_MAP } from "./constants";
import { getPlayerCapCost } from "./scoring";
import { getCoachPromptPools, getEligibleLineupSlots, getPlayerById, getPromptPools, getOpenSlots, randomInt, shuffleWithState } from "./utils";
import type { Coach, DraftPrompt, Franchise, GameMode, LineupAssignment, Player } from "../types";

type PromptBuildResult = {
  prompt: DraftPrompt | null;
  rngState: number;
};

export const getPromptKey = (prompt: Pick<DraftPrompt, "franchiseId" | "decadeTag"> | null) =>
  prompt ? `${prompt.franchiseId}:${prompt.decadeTag}` : null;

export const createInitialLineup = (): LineupAssignment => ({ ...EMPTY_LINEUP });

export const isLineupComplete = (lineup: LineupAssignment) =>
  LINEUP_SLOTS.every((slot) => Boolean(lineup[slot]));

export const isRosterComplete = (lineup: LineupAssignment, coachId: string | null) =>
  isLineupComplete(lineup) && Boolean(coachId);

export const buildDraftPrompt = (
  players: Player[],
  coaches: Coach[],
  franchises: Franchise[],
  lineup: LineupAssignment,
  coachId: string | null,
  draftedPlayerIds: string[],
  gameMode: GameMode,
  remainingBudget: number,
  rngState: number,
  lastPromptKey: string | null = null,
): PromptBuildResult => {
  if (!coachId) {
    const coachPools = getCoachPromptPools(coaches, franchises)
      .map((pool) => ({
        pool,
        eligible: pool.candidateIds.filter((candidateId) => candidateId !== coachId),
      }))
      .filter(({ eligible }) => eligible.length >= 2);

    const filteredCoachPools =
      lastPromptKey && coachPools.length > 1
        ? coachPools.filter(({ pool }) => getPromptKey(pool) !== lastPromptKey)
        : coachPools;

    if (!filteredCoachPools.length) {
      return { prompt: null, rngState };
    }

    const pickCoachPool = randomInt(rngState, filteredCoachPools.length);
    const selectedCoachPool = filteredCoachPools[pickCoachPool.index];
    const shuffledCoaches = shuffleWithState(selectedCoachPool.eligible, pickCoachPool.nextState);

    return {
      rngState: shuffledCoaches.nextState,
      prompt: {
        ...selectedCoachPool.pool,
        candidateIds: shuffledCoaches.items,
      },
    };
  }

  const openSlots = getOpenSlots(lineup);
  const capReserve = Math.max(openSlots.length - 1, 0);
  const allPools = getPromptPools(players, franchises)
    .map((pool) => {
      const eligible = pool.candidateIds
        .map((playerId) => getPlayerById(players, playerId))
        .filter((player): player is Player => Boolean(player))
        .filter(
          (player) => {
            if (draftedPlayerIds.includes(player.id)) {
              return false;
            }

            if (getEligibleLineupSlots(player, lineup).length === 0) {
              return false;
            }

            if (gameMode !== "cap") {
              return true;
            }

            return getPlayerCapCost(player) <= Math.max(remainingBudget - capReserve, 1);
          },
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
      candidateIds: shuffled.items.map((player) => player.id),
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

export const parseShareCode = (
  value: string,
): { seasonGames: number; gameMode: GameMode; lineup: LineupAssignment; coachId: string | null } | null => {
  const compactMatch = value.split("~");
  if (compactMatch.length === 3 + LINEUP_SLOTS.length) {
    const seasonGames = Number(compactMatch[0]);
    const gameMode = compactMatch[1] === "cap" ? "cap" : compactMatch[1] === "open" ? "open" : null;
    if ((seasonGames === 82 || seasonGames === 84) && gameMode) {
      const lineup = createInitialLineup();
      LINEUP_SLOTS.forEach((slot, index) => {
        const playerId = compactMatch[index + 2];
        lineup[slot] = playerId === "open" ? null : playerId;
      });
      const coachId = compactMatch[2 + LINEUP_SLOTS.length] === "open" ? null : compactMatch[2 + LINEUP_SLOTS.length];
      return { seasonGames, gameMode, lineup, coachId };
    }
  }

  if (compactMatch.length === 2 + LINEUP_SLOTS.length) {
    const seasonGames = Number(compactMatch[0]);
    if (seasonGames === 82 || seasonGames === 84) {
      const lineup = createInitialLineup();
      LINEUP_SLOTS.forEach((slot, index) => {
        const playerId = compactMatch[index + 1];
        lineup[slot] = playerId === "open" ? null : playerId;
      });
      const coachId = compactMatch[1 + LINEUP_SLOTS.length] === "open" ? null : compactMatch[1 + LINEUP_SLOTS.length];
      return { seasonGames, gameMode: "open", lineup, coachId };
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

  return {
    seasonGames,
    gameMode: parts.mode === "cap" ? "cap" : "open",
    lineup,
    coachId: parts.coach === "open" || !parts.coach ? null : parts.coach,
  };
};
