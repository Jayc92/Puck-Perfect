import { LINEUP_SLOTS } from "./constants";
import { calculateTeamRating, explainSeason, getGradeForRating, getStrengthsAndWeaknesses } from "./scoring";
import { clamp, hashString, nextRandom, round } from "./utils";
import type { Coach, GameMode, LineupAssignment, Player, SeasonResult } from "../types";

export const buildShareCode = (
  lineup: LineupAssignment,
  coachId: string | null,
  seasonGames: number,
  gameMode: GameMode = "open",
) =>
  [seasonGames, gameMode, ...LINEUP_SLOTS.map((slot) => lineup[slot] ?? "open"), coachId ?? "open"].join("~");

export const getSimulationSeed = (
  lineup: LineupAssignment,
  coachId: string | null,
  seasonGames: number,
  gameMode: GameMode,
) => hashString(buildShareCode(lineup, coachId, seasonGames, gameMode));

export const winProbabilityFromRatings = (
  teamRating: number,
  opponentRating: number,
  chemistry: number,
  goalieUnit: number,
  coachUnit: number,
) => {
  const eliteBonus =
    teamRating > 97 && goalieUnit > 93 && chemistry > 91
      ? 3.2
      : teamRating > 93 && chemistry > 88
        ? 1.8
        : 0;
  const score =
    teamRating -
    opponentRating +
    (chemistry - 80) * 0.38 +
    (goalieUnit - 82) * 0.16 +
    (coachUnit - 78) * 0.14 +
    eliteBonus;
  const sigmoid = 1 / (1 + Math.exp(-score / 9.4));
  return clamp(sigmoid, 0.2, 0.978);
};

export const simulateSeason = (
  lineup: LineupAssignment,
  coachId: string | null,
  players: Player[],
  coaches: Coach[],
  seasonGames: number,
  gameMode: GameMode,
): SeasonResult => {
  const breakdown = calculateTeamRating(lineup, players, coachId, coaches);
  const seed = getSimulationSeed(lineup, coachId, seasonGames, gameMode);
  let rngState = seed;
  let wins = 0;
  let probabilityTotal = 0;

  for (let game = 0; game < seasonGames; game += 1) {
    const first = nextRandom(rngState);
    rngState = first.nextState;
    const second = nextRandom(rngState);
    rngState = second.nextState;
    const third = nextRandom(rngState);
    rngState = third.nextState;

    const opponentRating = 54 + ((first.value + second.value) / 2) * 18;
    const fatigueModifier = game > seasonGames * 0.8 ? -((1 - (breakdown.chemistry + breakdown.coachUnit * 0.22) / 122) * 0.72) : 0;
    const winProbability = winProbabilityFromRatings(
      breakdown.teamRating + fatigueModifier,
      opponentRating,
      breakdown.chemistry,
      breakdown.goalieUnit,
      breakdown.coachUnit,
    );

    probabilityTotal += winProbability;
    if (third.value <= winProbability) {
      wins += 1;
    }
  }

  const losses = seasonGames - wins;
  const averageWinProbability = round((probabilityTotal / seasonGames) * 100, 1);
  const { strengths, weaknesses } = getStrengthsAndWeaknesses(breakdown);
  const shareCode = buildShareCode(lineup, coachId, seasonGames, gameMode);

  return {
    seed,
    seasonGames,
    gameMode,
    wins,
    losses,
    grade: getGradeForRating(breakdown.teamRating),
    teamRating: breakdown.teamRating,
    averageWinProbability,
    strengths,
    weaknesses,
    explanation: explainSeason(breakdown, wins, seasonGames),
    breakdown,
    shareCode,
  };
};
