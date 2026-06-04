import { GRADE_BANDS, SLOT_POSITION_MAP } from "./constants";
import { clamp, getPlayerById, round } from "./utils";
import type {
  LineupAssignment,
  LineupSlotId,
  Player,
  PlayerRatingBreakdown,
  SeasonResult,
  TeamRatingBreakdown,
} from "../types";

const ERA_MULTIPLIERS: Record<string, number> = {
  "1960s": 1.07,
  "1970s": 1.05,
  "1980s": 0.98,
  "1990s": 1.01,
  "2000s": 1.03,
  "2010s": 1.02,
  "2020s": 1,
};

const awardWeight = (awards?: string[]) => {
  if (!awards?.length) {
    return 0;
  }

  const highValueAwards = ["Hart", "Art Ross", "Vezina", "Norris", "Conn Smythe", "Selke"];
  const total = awards.reduce((sum, award) => {
    const isTopAward = highValueAwards.some((label) => award.includes(label));
    return sum + (isTopAward ? 1.8 : 0.7);
  }, 0);

  return clamp(total, 0, 6);
};

const getEraAdjustment = (player: Player) => {
  const decade = player.teams[0]?.decadeTags?.[0] ?? "2000s";
  return ERA_MULTIPLIERS[decade] ?? 1;
};

const getPerGame = (value: number | undefined, games: number) => (value ?? 0) / Math.max(games, 1);

const getPlayerRoleDefenseEstimate = (player: Player) => {
  const plusMinusValue = player.stats.plusMinus;
  const games = Math.max(player.stats.games, 1);

  if (typeof plusMinusValue === "number") {
    const baseline = player.primaryPosition === "D" ? 58 : 54;
    const swing = player.primaryPosition === "D" ? 16 : 10;
    return clamp(baseline + (plusMinusValue / games) * swing, 44, 90);
  }

  return player.primaryPosition === "D" ? 60 : 55;
};

export const calculateSkaterRating = (
  player: Player,
  assignedSlot: LineupSlotId,
): PlayerRatingBreakdown => {
  const goalsPerGame = getPerGame(player.stats.goals, player.stats.games);
  const assistsPerGame = getPerGame(player.stats.assists, player.stats.games);
  const pointsPerGame = getPerGame(player.stats.points, player.stats.games);
  const shotsPerGame = getPerGame(player.stats.shots, player.stats.games);
  const eraAdjustment = getEraAdjustment(player);
  const awardsBonus = awardWeight(player.awards);
  const defensiveEstimate = getPlayerRoleDefenseEstimate(player);

  let offense = 0;
  let defense = defensiveEstimate;

  if (SLOT_POSITION_MAP[assignedSlot] === "C") {
    offense =
      pointsPerGame * 48 +
      assistsPerGame * 24 +
      goalsPerGame * 14 +
      shotsPerGame * 2.5;
    defense += 6;
  } else if (SLOT_POSITION_MAP[assignedSlot] === "LW" || SLOT_POSITION_MAP[assignedSlot] === "RW") {
    offense =
      goalsPerGame * 30 +
      pointsPerGame * 42 +
      assistsPerGame * 10 +
      shotsPerGame * 4;
    defense += 2;
  } else {
    offense =
      pointsPerGame * 28 +
      assistsPerGame * 18 +
      goalsPerGame * 9 +
      shotsPerGame * 1.5;
    defense += 18;
  }

  const rawRating = (offense * 0.62 + defense * 0.38) * eraAdjustment + awardsBonus;
  const targetPosition = SLOT_POSITION_MAP[assignedSlot];
  const fitPenalty =
    player.primaryPosition === targetPosition ? 0 : player.eligiblePositions.includes(targetPosition) ? 4 : 12;

  const notes: string[] = [];
  if (typeof player.stats.plusMinus !== "number") {
    notes.push("Defensive value estimated conservatively because older stat coverage is limited.");
  }
  if (player.eraNotes) {
    notes.push(player.eraNotes);
  }

  return {
    playerId: player.id,
    rating: clamp(round(rawRating - fitPenalty, 1), 38, 100),
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
  const savePct = player.stats.savePct ?? 0.9;
  const gaa = player.stats.gaa ?? 2.8;
  const shutoutsPer100Games = ((player.stats.shutouts ?? 0) / Math.max(player.stats.games, 1)) * 100;
  const winsPerGame = ((player.stats.goalieWins ?? 0) / Math.max(player.stats.games, 1));
  const eraAdjustment = getEraAdjustment(player);
  const awardsBonus = awardWeight(player.awards);

  const winsScore = clamp(25 + winsPerGame * 70, 25, 85);
  const savePctScore = clamp(50 + (savePct - 0.9) * 1200, 35, 96);
  const gaaScore = clamp(72 - (gaa - 2.5) * 14, 35, 92);
  const shutoutScore = clamp(shutoutsPer100Games * 2.5, 0, 18);

  const offense = winsScore;
  const defense =
    savePctScore * 0.58 +
    gaaScore * 0.32 +
    shutoutScore * 0.1;

  const rawRating = (offense * 0.2 + defense * 0.8) * eraAdjustment + awardsBonus;
  const fitPenalty = assignedSlot === "G" ? 0 : 18;

  return {
    playerId: player.id,
    rating: clamp(round(rawRating - fitPenalty, 1), 38, 96),
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

const getSpreadPenalty = (ratings: number[]) => {
  if (!ratings.length) {
    return 0;
  }
  const max = Math.max(...ratings);
  const min = Math.min(...ratings);
  return clamp((max - min) * 0.32, 0, 14);
};

const getGrade = (teamRating: number) =>
  GRADE_BANDS.find((band) => teamRating >= band.min)?.grade ?? "F";

export const calculateTeamRating = (
  lineup: LineupAssignment,
  players: Player[],
): TeamRatingBreakdown => {
  const notes = [
    "Forwards drive 41% of the team rating, defense 26%, goalie 23%, and chemistry/fit 10%.",
  ];

  const breakdowns = {} as Record<LineupSlotId, PlayerRatingBreakdown>;
  const filledEntries = Object.entries(lineup).filter((entry): entry is [LineupSlotId, string] => Boolean(entry[1]));

  filledEntries.forEach(([slot, playerId]) => {
    const player = getPlayerById(players, playerId);
    if (!player) {
      return;
    }
    breakdowns[slot] = calculatePlayerRating(player, slot);
  });

  const forwardRatings = ["LW", "C", "RW"]
    .map((slot) => breakdowns[slot as LineupSlotId]?.rating ?? 0)
    .filter(Boolean);
  const defenseRatings = ["D1", "D2"]
    .map((slot) => breakdowns[slot as LineupSlotId]?.rating ?? 0)
    .filter(Boolean);
  const goalieRating = breakdowns.G?.rating ?? 0;

  const forwardUnit = round(forwardRatings.reduce((sum, value) => sum + value, 0) / Math.max(forwardRatings.length, 1), 1);
  const defenseUnit = round(defenseRatings.reduce((sum, value) => sum + value, 0) / Math.max(defenseRatings.length, 1), 1);
  const balancePenalty = getSpreadPenalty([
    ...forwardRatings,
    ...defenseRatings,
    goalieRating,
  ]);

  const fitScore = round(
    clamp(
      100 -
        Object.values(breakdowns).reduce((sum, item) => sum + item.fitPenalty, 0) * 2.8,
      52,
      100,
    ),
    1,
  );

  const balanceScore = round(
    clamp(
      100 - balancePenalty - Math.abs(forwardUnit - defenseUnit) * 0.45,
      48,
      100,
    ),
    1,
  );

  const chemistry = round(
    clamp(
      fitScore * 0.5 +
        balanceScore * 0.38 +
        (goalieRating > 88 ? 8 : 0) +
        (defenseUnit > 84 ? 5 : 0) +
        (forwardUnit > 88 ? 4 : 0),
      48,
      100,
    ),
    1,
  );

  if (fitScore < 82) {
    notes.push("At least one player is playing away from their natural slot, which drags down fit.");
  }
  if (balanceScore < 78) {
    notes.push("The lineup leans heavily into one strength instead of staying balanced across all six spots.");
  }

  const teamRating = round(
    clamp(
      forwardUnit * 0.41 +
        defenseUnit * 0.26 +
        goalieRating * 0.23 +
        chemistry * 0.1,
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
    chemistry,
    fitScore,
    balanceScore,
    playerBreakdowns: breakdowns,
    notes,
  };
};

export const getResultSummary = (
  result: SeasonResult,
  lineup: LineupAssignment,
  players: Player[],
) => {
  const slotSummary = Object.entries(lineup)
    .map(([slot, playerId]) => {
      const player = getPlayerById(players, playerId);
      return player ? `${slot}: ${player.name}` : `${slot}: Open`;
    })
    .join(" | ");

  return [
    `Puck Perfect: ${result.wins}-${result.losses}`,
    `${result.seasonGames}-game season • Grade ${result.grade} • Team rating ${result.teamRating}`,
    result.explanation,
    slotSummary,
  ].join("\n");
};

export const getStrengthsAndWeaknesses = (
  breakdown: TeamRatingBreakdown,
): Pick<SeasonResult, "strengths" | "weaknesses"> => {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (breakdown.goalieUnit >= 90) {
    strengths.push("Elite goaltending gives you a real bailout engine in tight games.");
  }
  if (breakdown.forwardUnit >= 88) {
    strengths.push("Top-end scoring drives strong win probability almost every night.");
  }
  if (breakdown.defenseUnit >= 86) {
    strengths.push("Blue-line quality keeps the lineup steady over a long schedule.");
  }
  if (breakdown.chemistry >= 88) {
    strengths.push("Lineup balance and clean positional fit boost consistency.");
  }

  if (breakdown.goalieUnit <= 77) {
    weaknesses.push("Goaltending is solid but not dominant, so perfect-season odds stay slim.");
  }
  if (breakdown.defenseUnit <= 78) {
    weaknesses.push("Defense depth is the biggest leak against strong opponents.");
  }
  if (breakdown.forwardUnit <= 80) {
    weaknesses.push("The attack can go cold compared with elite all-time lineups.");
  }
  if (breakdown.fitScore <= 82) {
    weaknesses.push("Out-of-position usage costs enough fit to shave wins off the top end.");
  }

  return {
    strengths: strengths.length ? strengths : ["Balanced talent keeps the lineup competitive in every phase."],
    weaknesses: weaknesses.length ? weaknesses : ["There is no glaring weakness, but perfection still demands some luck."],
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

  if (breakdown.goalieUnit >= breakdown.forwardUnit && breakdown.goalieUnit >= breakdown.defenseUnit) {
    drivers.push("elite goaltending");
  }
  if (breakdown.forwardUnit >= 86) {
    drivers.push("scoring talent");
  }
  if (breakdown.defenseUnit >= 84) {
    drivers.push("defensive structure");
  }
  if (breakdown.chemistry >= 86) {
    drivers.push("lineup balance");
  }

  if (breakdown.defenseUnit < 80) {
    drags.push("defense depth");
  }
  if (breakdown.fitScore < 84) {
    drags.push("position fit");
  }
  if (breakdown.goalieUnit < 80) {
    drags.push("goaltending volatility");
  }
  if (breakdown.forwardUnit < 82) {
    drags.push("inconsistent finishing");
  }

  const driverText = drivers.length ? drivers.join(" and ") : "overall lineup quality";
  const dragText = drags.length ? drags[0] : "perfect-season variance";

  return `Your team went ${wins}-${lossCount} because ${driverText} carried the lineup, but ${dragText} lowered the perfect-season odds.`;
};

export const getGradeForRating = getGrade;
