import { GRADE_BANDS, SLOT_POSITION_MAP } from "./constants";
import { clamp, getCoachById, getPlayerById, round } from "./utils";
import type {
  Coach,
  CoachRatingBreakdown,
  LineupAssignment,
  LineupSlotId,
  Player,
  PlayerRatingBreakdown,
  SeasonResult,
  TeamRatingBreakdown,
} from "../types";

const ERA_MULTIPLIERS: Record<string, number> = {
  "1960s": 1.05,
  "1970s": 1.03,
  "1980s": 1.0,
  "1990s": 1.01,
  "2000s": 1.02,
  "2010s": 1.01,
  "2020s": 1,
};

const HIGH_VALUE_AWARDS = ["Hart", "Art Ross", "Rocket", "Vezina", "Norris", "Conn Smythe", "Selke", "Ted Lindsay"];

const getGrade = (teamRating: number) =>
  GRADE_BANDS.find((band) => teamRating >= band.min)?.grade ?? "F";

const getPerGame = (value: number | undefined, games: number) => (value ?? 0) / Math.max(games, 1);

const logNormalize = (value: number, cap: number) =>
  clamp(Math.log1p(Math.max(value, 0)) / Math.log1p(cap), 0, 1.12);

const linearNormalize = (value: number, max: number) =>
  clamp(value / max, 0, 1.12);

const awardWeight = (awards?: string[]) => {
  if (!awards?.length) {
    return 0;
  }

  return clamp(
    awards.reduce((sum, award) => sum + (HIGH_VALUE_AWARDS.some((label) => award.includes(label)) ? 2.4 : 0.8), 0),
    0,
    14,
  );
};

const getEraAdjustment = (player: Player) => {
  const decade = player.teams[0]?.decadeTags?.[0] ?? "2000s";
  return ERA_MULTIPLIERS[decade] ?? 1;
};

const getDefensiveImpact = (player: Player) => {
  const plusMinusPerGame = getPerGame(player.stats.plusMinus, player.stats.games);
  const awardBoost = player.awards?.some((award) => award.includes("Selke") || award.includes("Norris")) ? 6 : 0;

  if (player.primaryPosition === "D") {
    return clamp(64 + plusMinusPerGame * 24 + awardBoost, 52, 100);
  }

  return clamp(56 + plusMinusPerGame * 18 + awardBoost, 45, 96);
};

export const calculateSkaterRating = (
  player: Player,
  assignedSlot: LineupSlotId,
): PlayerRatingBreakdown => {
  const games = Math.max(player.stats.games, 1);
  const goalsPerGame = getPerGame(player.stats.goals, games);
  const assistsPerGame = getPerGame(player.stats.assists, games);
  const pointsPerGame = getPerGame(player.stats.points, games);
  const shotsPerGame = getPerGame(player.stats.shots, games);
  const defensiveImpact = getDefensiveImpact(player);
  const eraAdjustment = getEraAdjustment(player);
  const awardsBonus = awardWeight(player.awards);
  const targetPosition = SLOT_POSITION_MAP[assignedSlot];

  const careerScoringBonus = player.primaryPosition === "D"
    ? logNormalize(player.stats.points ?? 0, 1700)
    : logNormalize(player.stats.points ?? 0, 2600);

  let offense = 0;
  let defense = defensiveImpact;

  if (targetPosition === "C") {
    offense =
      linearNormalize(pointsPerGame, 1.9) * 28 +
      linearNormalize(assistsPerGame, 1.35) * 20 +
      linearNormalize(goalsPerGame, 0.75) * 12 +
      linearNormalize(shotsPerGame, 4.6) * 6 +
      careerScoringBonus * 10;
    defense += 6;
  } else if (targetPosition === "LW" || targetPosition === "RW") {
    offense =
      linearNormalize(pointsPerGame, 1.75) * 28 +
      linearNormalize(goalsPerGame, 0.72) * 18 +
      linearNormalize(assistsPerGame, 1.1) * 10 +
      linearNormalize(shotsPerGame, 5.0) * 6 +
      careerScoringBonus * 8;
    defense += 2;
  } else {
    offense =
      linearNormalize(pointsPerGame, 1.3) * 32 +
      linearNormalize(assistsPerGame, 1.0) * 14 +
      linearNormalize(goalsPerGame, 0.35) * 7 +
      linearNormalize(shotsPerGame, 3.5) * 5 +
      careerScoringBonus * 10;
    defense += 14;
  }

  const rawRating = (offense + defense * 0.26 + awardsBonus) * eraAdjustment;
  const fitPenalty =
    player.primaryPosition === targetPosition
      ? 0
      : player.eligiblePositions.includes(targetPosition)
        ? 2
        : 14;

  const notes: string[] = [];
  if (typeof player.stats.plusMinus !== "number") {
    notes.push("Defensive value estimated conservatively because older stat coverage is limited.");
  }
  if (player.eraNotes) {
    notes.push(player.eraNotes);
  }

  return {
    playerId: player.id,
    rating: clamp(round(rawRating - fitPenalty, 1), 44, 100),
    offense: round(offense * eraAdjustment, 1),
    defense: round(defense * eraAdjustment, 1),
    eraAdjustment: round((eraAdjustment - 1) * 100, 1),
    awardsBonus: round(awardsBonus, 1),
    fitPenalty,
    notes,
  };
};

export const calculateGoalieRating = (
  player: Player,
  assignedSlot: LineupSlotId,
): PlayerRatingBreakdown => {
  const wins = player.stats.goalieWins ?? 0;
  const savePct = player.stats.savePct ?? 0.905;
  const gaa = player.stats.gaa ?? 2.75;
  const shutouts = player.stats.shutouts ?? 0;
  const eraAdjustment = getEraAdjustment(player);
  const awardsBonus = awardWeight(player.awards);

  const winsScore = logNormalize(wins, 700) * 40;
  const savePctScore = linearNormalize(Math.max(savePct - 0.885, 0), 0.045) * 20;
  const gaaScore = linearNormalize(Math.max(4.1 - gaa, 0), 2.0) * 10;
  const shutoutScore = logNormalize(shutouts, 130) * 6;
  const winRateScore = linearNormalize(wins / Math.max(player.stats.games, 1), 0.72) * 8;

  const offense = winsScore + winRateScore;
  const defense = savePctScore + gaaScore + shutoutScore;
  const rawRating = (offense + defense + awardsBonus) * eraAdjustment;
  const fitPenalty = assignedSlot === "G" ? 0 : 18;

  return {
    playerId: player.id,
    rating: clamp(round(rawRating - fitPenalty, 1), 50, 100),
    offense: round(offense * eraAdjustment, 1),
    defense: round(defense * eraAdjustment, 1),
    eraAdjustment: round((eraAdjustment - 1) * 100, 1),
    awardsBonus: round(awardsBonus, 1),
    fitPenalty,
    notes: [],
  };
};

export const calculatePlayerRating = (
  player: Player,
  assignedSlot: LineupSlotId,
) => (player.primaryPosition === "G"
  ? calculateGoalieRating(player, assignedSlot)
  : calculateSkaterRating(player, assignedSlot));

export const calculateCoachRating = (coach: Coach): CoachRatingBreakdown => {
  const winsScore = logNormalize(coach.stats.wins, 1300) * 62;
  const efficiencyScore = linearNormalize(Math.max(coach.stats.winPct - 0.45, 0), 0.24) * 24;
  const cupsBonus = clamp(coach.stats.cups * 3.2, 0, 14);

  return {
    coachId: coach.id,
    rating: clamp(round(winsScore + efficiencyScore + cupsBonus, 1), 48, 100),
    winsScore: round(winsScore, 1),
    efficiencyScore: round(efficiencyScore, 1),
    cupsBonus: round(cupsBonus, 1),
    notes: coach.stats.cups > 0 ? ["Stanley Cup pedigree adds a meaningful bench boost."] : [],
  };
};

const getSpreadPenalty = (ratings: number[]) => {
  if (!ratings.length) {
    return 0;
  }
  return clamp((Math.max(...ratings) - Math.min(...ratings)) * 0.22, 0, 12);
};

export const calculateTeamRating = (
  lineup: LineupAssignment,
  players: Player[],
  coachId: string | null,
  coaches: Coach[],
): TeamRatingBreakdown => {
  const notes = [
    "Forwards drive 34% of the team rating, defense 22%, goalie 22%, coach 6%, and chemistry/fit 16%.",
  ];

  const breakdowns = {} as Record<LineupSlotId, PlayerRatingBreakdown>;
  const filledEntries = Object.entries(lineup).filter((entry): entry is [LineupSlotId, string] => Boolean(entry[1]));

  filledEntries.forEach(([slot, playerId]) => {
    const player = getPlayerById(players, playerId);
    if (player) {
      breakdowns[slot] = calculatePlayerRating(player, slot);
    }
  });

  const forwardRatings = ["LW", "C", "RW"].map((slot) => breakdowns[slot as LineupSlotId]?.rating ?? 0).filter(Boolean);
  const defenseRatings = ["D1", "D2"].map((slot) => breakdowns[slot as LineupSlotId]?.rating ?? 0).filter(Boolean);
  const goalieRating = breakdowns.G?.rating ?? 0;
  const coach = getCoachById(coaches, coachId);
  const coachBreakdown = coach ? calculateCoachRating(coach) : null;
  const coachUnit = coachBreakdown?.rating ?? 0;

  const forwardUnit = round(forwardRatings.reduce((sum, value) => sum + value, 0) / Math.max(forwardRatings.length, 1), 1);
  const defenseUnit = round(defenseRatings.reduce((sum, value) => sum + value, 0) / Math.max(defenseRatings.length, 1), 1);

  const balancePenalty = getSpreadPenalty([...forwardRatings, ...defenseRatings, goalieRating]);
  const fitScore = round(
    clamp(100 - Object.values(breakdowns).reduce((sum, item) => sum + item.fitPenalty, 0) * 2.1, 58, 100),
    1,
  );
  const balanceScore = round(
    clamp(100 - balancePenalty - Math.abs(forwardUnit - defenseUnit) * 0.34 - Math.abs(goalieRating - defenseUnit) * 0.18, 56, 100),
    1,
  );
  const chemistry = round(
    clamp(
      fitScore * 0.34 +
        balanceScore * 0.3 +
        coachUnit * 0.18 +
        (forwardUnit > 90 ? 8 : 0) +
        (defenseUnit > 88 ? 6 : 0) +
        (goalieRating > 92 ? 6 : 0),
      56,
      100,
    ),
    1,
  );

  if (fitScore < 86) {
    notes.push("At least one player is leaning on secondary eligibility, which trims some positional comfort.");
  }
  if (balanceScore < 80) {
    notes.push("The lineup is star-heavy in one area but not equally terrifying across all phases.");
  }
  if (coachUnit >= 90) {
    notes.push("A high-end coach helps the lineup stay sharp over a full season.");
  }

  const teamRating = round(
    clamp(
      forwardUnit * 0.34 +
        defenseUnit * 0.22 +
        goalieRating * 0.22 +
        coachUnit * 0.06 +
        chemistry * 0.16,
      0,
      100,
    ),
    1,
  );

  return {
    teamRating,
    forwardUnit,
    defenseUnit,
    goalieUnit: goalieRating,
    coachUnit,
    chemistry,
    fitScore,
    balanceScore,
    playerBreakdowns: breakdowns,
    coachBreakdown,
    notes,
  };
};

export const getResultSummary = (
  result: SeasonResult,
  lineup: LineupAssignment,
  players: Player[],
  coachId: string | null,
  coaches: Coach[],
) => {
  const slotSummary = Object.entries(lineup)
    .map(([slot, playerId]) => {
      const player = getPlayerById(players, playerId);
      return player ? `${slot}: ${player.name}` : `${slot}: Open`;
    })
    .join(" | ");
  const coach = getCoachById(coaches, coachId);

  return [
    `Puck Perfect: ${result.wins}-${result.losses}`,
    `${result.seasonGames}-game season • Grade ${result.grade} • Team rating ${result.teamRating}`,
    result.explanation,
    slotSummary,
    `Coach: ${coach?.name ?? "Open"}`,
  ].join("\n");
};

export const getStrengthsAndWeaknesses = (
  breakdown: TeamRatingBreakdown,
): Pick<SeasonResult, "strengths" | "weaknesses"> => {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (breakdown.goalieUnit >= 92) {
    strengths.push("Elite goaltending can erase mistakes and steal high-leverage nights.");
  }
  if (breakdown.forwardUnit >= 90) {
    strengths.push("Top-end scoring talent keeps the offense dangerous almost every game.");
  }
  if (breakdown.defenseUnit >= 88) {
    strengths.push("Blue-line stars keep the lineup from being all flash and no control.");
  }
  if (breakdown.chemistry >= 90) {
    strengths.push("Flexible fit and lineup balance raise your ceiling over a long schedule.");
  }
  if (breakdown.coachUnit >= 88) {
    strengths.push("Strong coaching improves consistency without dominating the whole outcome.");
  }

  if (breakdown.goalieUnit <= 78) {
    weaknesses.push("Goaltending is competent but not terrifying, which caps perfect-season odds.");
  }
  if (breakdown.defenseUnit <= 80) {
    weaknesses.push("Defense still leaks too much against stacked opponents.");
  }
  if (breakdown.forwardUnit <= 82) {
    weaknesses.push("The attack lacks enough nightly punch for a historic win pace.");
  }
  if (breakdown.coachUnit <= 72) {
    weaknesses.push("The coaching edge is modest compared with elite bench bosses.");
  }
  if (breakdown.fitScore <= 86) {
    weaknesses.push("Secondary-position usage trims some of the lineup's total efficiency.");
  }

  return {
    strengths: strengths.length ? strengths : ["Balanced talent keeps the roster dangerous in every phase."],
    weaknesses: weaknesses.length ? weaknesses : ["There is no obvious weak spot, but chasing perfection still requires some luck."],
  };
};

export const explainSeason = (
  breakdown: TeamRatingBreakdown,
  wins: number,
  seasonGames: number,
) => {
  const lossCount = seasonGames - wins;
  const drivers: string[] = [];
  const drags: string[] = [];

  if (breakdown.forwardUnit >= 90) {
    drivers.push("elite scoring");
  }
  if (breakdown.defenseUnit >= 88) {
    drivers.push("star defense");
  }
  if (breakdown.goalieUnit >= 92) {
    drivers.push("franchise goaltending");
  }
  if (breakdown.coachUnit >= 88) {
    drivers.push("strong coaching");
  }
  if (breakdown.chemistry >= 90) {
    drivers.push("lineup balance");
  }

  if (breakdown.defenseUnit < 82) {
    drags.push("defense depth");
  }
  if (breakdown.goalieUnit < 82) {
    drags.push("goaltending volatility");
  }
  if (breakdown.coachUnit < 74) {
    drags.push("a smaller coaching edge");
  }
  if (breakdown.fitScore < 88) {
    drags.push("fit efficiency");
  }

  const driverText = drivers.length ? drivers.join(" and ") : "overall lineup quality";
  const dragText = drags.length ? drags[0] : "perfect-season variance";

  return `Your team went ${wins}-${lossCount} because ${driverText} carried the roster, but ${dragText} lowered the perfect-season odds.`;
};

export const getGradeForRating = getGrade;
