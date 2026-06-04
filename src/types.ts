export type PlayerPosition = "LW" | "C" | "RW" | "D" | "G";

export type LineupSlotId = "LW" | "C" | "RW" | "D1" | "D2" | "G";

export type GameStatus =
  | "intro"
  | "ready"
  | "spinning"
  | "choosingPlayer"
  | "assigningSlot"
  | "complete"
  | "results";

export type TeamTenure = {
  franchiseId: string;
  teamName: string;
  startSeason: number;
  endSeason: number;
  decadeTags: string[];
};

export type PlayerStats = {
  games: number;
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  shots?: number;
  penaltyMinutes?: number;
  goalieWins?: number;
  goalieLosses?: number;
  goalieTiesOt?: number;
  savePct?: number;
  gaa?: number;
  shutouts?: number;
};

export type Player = {
  id: string;
  name: string;
  primaryPosition: PlayerPosition;
  eligiblePositions: PlayerPosition[];
  franchiseIds: string[];
  teams: TeamTenure[];
  stats: PlayerStats;
  awards?: string[];
  eraNotes?: string;
  roleTag: string;
  sourceQuality: "sample" | "imported" | "verified";
};

export type Franchise = {
  id: string;
  displayName: string;
  aliases: string[];
  active: boolean;
};

export type DraftPrompt = {
  franchiseId: string;
  franchiseName: string;
  decadeTag: string;
  poolLabel: string;
  playerIds: string[];
};

export type LineupAssignment = Record<LineupSlotId, string | null>;

export type PlayerRatingBreakdown = {
  playerId: string;
  rating: number;
  offense: number;
  defense: number;
  eraAdjustment: number;
  awardsBonus: number;
  fitPenalty: number;
  notes: string[];
};

export type TeamRatingBreakdown = {
  teamRating: number;
  forwardUnit: number;
  defenseUnit: number;
  goalieUnit: number;
  chemistry: number;
  fitScore: number;
  balanceScore: number;
  playerBreakdowns: Record<LineupSlotId, PlayerRatingBreakdown>;
  notes: string[];
};

export type SeasonResult = {
  seed: number;
  seasonGames: number;
  wins: number;
  losses: number;
  grade: string;
  teamRating: number;
  averageWinProbability: number;
  strengths: string[];
  weaknesses: string[];
  explanation: string;
  breakdown: TeamRatingBreakdown;
  shareCode: string;
};

export type PersistedGameState = {
  version: number;
  status: GameStatus;
  lineup: LineupAssignment;
  draftedPlayerIds: string[];
  currentPrompt: DraftPrompt | null;
  lastPromptKey: string | null;
  selectedPlayerId: string | null;
  seasonGames: 82 | 84;
  rngState: number;
  result: SeasonResult | null;
};
