import { LINEUP_SLOTS } from "./constants";
import { calculateTeamRating, explainSeason, getGradeForRating, getStrengthsAndWeaknesses } from "./scoring";
import { clamp, hashString, nextRandom, round } from "./utils";
import type { LineupAssignment, Player, SeasonResult } from "../types";

export const buildShareCode = (
  lineup: LineupAssignment,
  seasonGames: 82 | 84,
) =>
  [seasonGames, ...LINEUP_SLOTS.map((slot) => lineup[slot] ?? "open")].join("~");

export const getSimulationSeed = (
  lineup: LineupAssignment,
  seasonGames: 82 | 84,
) => hashString(buildShareCode(lineup, seasonGames));

export const winProbabilityFromRatings = (
  teamRating: number,
  opponentRating: number,
  chemistry: number,
  goalieUnit: number,
) => {
  const eliteBonus =
    teamRating > 93 && goalieUnit > 90
      ? 3.6
      : teamRating > 89 && chemistry > 88
        ? 1.8
        : 0;
  const score =
    teamRating -
    opponentRating +
    (chemistry - 78) * 0.28 +
    (goalieUnit - 82) * 0.18 +
    eliteBonus;
  const sigmoid = 1 / (1 + Math.exp(-score / 7.7));
  return clamp(sigmoid, 0.14, 0.992);
};

export const simulateSeason = (
  lineup: LineupAssignment,
  players: Player[],
  seasonGames: 82 | 84,
): SeasonResult => {
  const breakdown = calculateTeamRating(lineup, players);
  const seed = getSimulationSeed(lineup, seasonGames);
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

    const opponentRating = 58 + ((first.value + second.value) / 2) * 26;
    const fatigueModifier = game > seasonGames * 0.75 ? -((1 - breakdown.chemistry / 100) * 1.8) : 0;
    const winProbability = winProbabilityFromRatings(
      breakdown.teamRating + fatigueModifier,
      opponentRating,
      breakdown.chemistry,
      breakdown.goalieUnit,
    );

    probabilityTotal += winProbability;
    if (third.value <= winProbability) {
      wins += 1;
    }
  }

  const losses = seasonGames - wins;
  const averageWinProbability = round((probabilityTotal / seasonGames) * 100, 1);
  const { strengths, weaknesses } = getStrengthsAndWeaknesses(breakdown);
  const shareCode = buildShareCode(lineup, seasonGames);

  return {
    seed,
    seasonGames,
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
