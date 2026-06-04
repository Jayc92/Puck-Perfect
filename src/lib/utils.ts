import { LINEUP_SLOTS, SLOT_POSITION_MAP } from "./constants";
import type { Coach, DraftPrompt, Franchise, LineupAssignment, LineupSlotId, Player, PlayerPosition } from "../types";

type RandomResult = {
  value: number;
  nextState: number;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const round = (value: number, precision = 1) => {
  const power = 10 ** precision;
  return Math.round(value * power) / power;
};

export const nextRandom = (state: number): RandomResult => {
  const nextState = (Math.imul(1664525, state) + 1013904223) >>> 0;
  return { value: nextState / 4294967296, nextState };
};

export const randomInt = (state: number, max: number): { index: number; nextState: number } => {
  const { value, nextState } = nextRandom(state);
  return { index: Math.floor(value * max), nextState };
};

export const shuffleWithState = <T,>(items: T[], state: number): { items: T[]; nextState: number } => {
  const result = [...items];
  let nextStateValue = state;

  for (let index = result.length - 1; index > 0; index -= 1) {
    const random = randomInt(nextStateValue, index + 1);
    nextStateValue = random.nextState;
    [result[index], result[random.index]] = [result[random.index], result[index]];
  }

  return { items: result, nextState: nextStateValue };
};

export const getOpenSlots = (lineup: LineupAssignment): LineupSlotId[] =>
  LINEUP_SLOTS.filter((slot) => !lineup[slot]);

export const getPlayerById = (players: Player[], playerId: string | null) =>
  playerId ? players.find((player) => player.id === playerId) ?? null : null;

export const getCoachById = (coaches: Coach[], coachId: string | null) =>
  coachId ? coaches.find((coach) => coach.id === coachId) ?? null : null;

export const getEligibleLineupSlots = (
  player: Player,
  lineup: LineupAssignment,
): LineupSlotId[] =>
  getOpenSlots(lineup).filter((slot) => player.eligiblePositions.includes(SLOT_POSITION_MAP[slot]));

export const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const getDecadeLabel = (season: number) =>
  `${Math.floor(season / 10) * 10}s`;

export const buildFranchiseLookup = (franchises: Franchise[]) =>
  Object.fromEntries(franchises.map((franchise) => [franchise.id, franchise]));

export const getPromptPools = (players: Player[], franchises: Franchise[]) => {
  const franchiseLookup = buildFranchiseLookup(franchises);
  const poolMap = new Map<string, DraftPrompt>();

  players.forEach((player) => {
    player.teams.forEach((team) => {
      team.decadeTags.forEach((decadeTag) => {
        const key = `${team.franchiseId}:${decadeTag}`;
        const existing = poolMap.get(key);
        if (existing) {
          existing.candidateIds.push(player.id);
          return;
        }

        const franchiseName =
          franchiseLookup[team.franchiseId]?.displayName ?? team.teamName;

        poolMap.set(key, {
          kind: "player",
          franchiseId: team.franchiseId,
          franchiseName,
          decadeTag,
          poolLabel: `${franchiseName}, ${decadeTag}`,
          candidateIds: [player.id],
        });
      });
    });
  });

  return [...poolMap.values()];
};

export const getCoachPromptPools = (coaches: Coach[], franchises: Franchise[]) => {
  const franchiseLookup = buildFranchiseLookup(franchises);
  const poolMap = new Map<string, DraftPrompt>();

  coaches.forEach((coach) => {
    coach.teams.forEach((team) => {
      team.decadeTags.forEach((decadeTag) => {
        const key = `${team.franchiseId}:${decadeTag}`;
        const existing = poolMap.get(key);
        if (existing) {
          existing.candidateIds.push(coach.id);
          return;
        }

        const franchiseName =
          franchiseLookup[team.franchiseId]?.displayName ?? team.teamName;

        poolMap.set(key, {
          kind: "coach",
          franchiseId: team.franchiseId,
          franchiseName,
          decadeTag,
          poolLabel: `${franchiseName}, ${decadeTag}`,
          candidateIds: [coach.id],
        });
      });
    });
  });

  return [...poolMap.values()];
};

export const getPlayerSeasonLabel = (player: Player, franchiseId?: string) => {
  const team = franchiseId
    ? player.teams.find((entry) => entry.franchiseId === franchiseId) ?? player.teams[0]
    : player.teams[0];

  const decade = team.decadeTags[0] ?? getDecadeLabel(team.startSeason);
  return `${team.teamName} • ${decade}`;
};

export const getCoachSeasonLabel = (coach: Coach, franchiseId?: string) => {
  const team = franchiseId
    ? coach.teams.find((entry) => entry.franchiseId === franchiseId) ?? coach.teams[0]
    : coach.teams[0];

  const decade = team.decadeTags[0] ?? getDecadeLabel(team.startSeason);
  return `${team.teamName} • ${decade}`;
};

export const getRoleColor = (position: PlayerPosition) => {
  switch (position) {
    case "G":
      return "text-aurora";
    case "D":
      return "text-ice";
    default:
      return "text-ember";
  }
};
