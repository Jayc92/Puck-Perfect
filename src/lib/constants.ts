import type { LineupAssignment, LineupSlotId, PlayerPosition } from "../types";

export const CURRENT_GAME_STATE_VERSION = 4;
export const APP_STORAGE_KEY = "puck-perfect:game-state:v4";
export const LEGACY_APP_STORAGE_KEYS = [
  "puck-perfect:game-state:v1",
  "puck-perfect:game-state:v2",
  "puck-perfect:game-state:v3",
] as const;
export const APP_TUTORIAL_KEY = "puck-perfect:tutorial-hidden:v1";

export const LINEUP_SLOTS: LineupSlotId[] = ["LW", "C", "RW", "D1", "D2", "G"];

export const EMPTY_LINEUP: LineupAssignment = {
  LW: null,
  C: null,
  RW: null,
  D1: null,
  D2: null,
  G: null,
};

export const SLOT_POSITION_MAP: Record<LineupSlotId, PlayerPosition> = {
  LW: "LW",
  C: "C",
  RW: "RW",
  D1: "D",
  D2: "D",
  G: "G",
};

export const SEASON_OPTIONS = [82, 84] as const;

export const GRADE_BANDS = [
  { min: 96, grade: "A+" },
  { min: 92, grade: "A" },
  { min: 88, grade: "A-" },
  { min: 84, grade: "B+" },
  { min: 79, grade: "B" },
  { min: 74, grade: "B-" },
  { min: 69, grade: "C+" },
  { min: 64, grade: "C" },
  { min: 58, grade: "C-" },
  { min: 52, grade: "D" },
  { min: 0, grade: "F" },
];
