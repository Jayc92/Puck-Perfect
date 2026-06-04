import { LINEUP_SLOTS } from "./constants";
import { calculateTeamRating, explainSeason, getGradeForRating, getStrengthsAndWeaknesses } from "./scoring";
import { clamp, hashString, nextRandom, round } from "./utils";
import type { Coach, LineupAssignment, Player, SeasonResult } from "../types";

export const buildShareCode = (
  lineup: LineupAssignment,
  coachId: string | null,
  seasonGames: 82 | 84,
) =>
  [seasonGames, ...LINEUP_SLOTS.map((slot) => lineup[slot] ?? "open"), coachId ?? "open"].join("~");

export const getSimulationSeed = (
  lineup: LineupAssignment,
  coachId: string | null,
  seasonGames: 82 | 84,
) => hashString(buildShareCode(lineup, coachId, seasonGames));

export const winProbabilityFromRatings = (
  teamRating: number,
  opponentRating: number,
  chemistry: number,
  goalieUnit: number,
  coachUnit: number,
) => {
  const eliteBonus =
    teamRating > 96 && goalieUnit > 92
      ? 2.2
      : teamRating > 91 && chemistry > 88
        ? 1.2
        : 0;
  const score =
    teamRating -
    opponentRating +
    (chemistry - 80) * 0.32 +
    (goalieUnit - 82) * 0.14 +
    (coachUnit - 78) * 0.12 +
    eliteBonus;
  const sigmoid = 1 / (1 + Math.exp(-score / 10.8));
  return clamp(sigmoid, 0.18, 0.972);
};

export const simulateSeason = (
  lineup: LineupAssignment,
  coachId: string | null,
  players: Player[],
  coaches: Coach[],
  seasonGames: 82 | 84,
): SeasonResult => {
  const breakdown = calculateTeamRating(lineup, players, coachId, coaches);
  const seed = getSimulationSeed(lineup, coachId, seasonGames);
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

    const opponentRating = 60 + ((first.value + second.value) / 2) * 24;
    const fatigueModifier = game > seasonGames * 0.75 ? -((1 - (breakdown.chemistry + breakdown.coachUnit * 0.2) / 120) * 1.3) : 0;
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
  const shareCode = buildShareCode(lineup, coachId, seasonGames);

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
