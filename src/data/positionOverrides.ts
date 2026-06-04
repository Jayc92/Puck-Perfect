import type { PlayerPosition } from "../types";

type PositionOverride = {
  primaryPosition?: PlayerPosition;
  eligiblePositions?: PlayerPosition[];
};

// Keep this surgical. Add only confirmed fixes from playtesting rather than
// reintroducing broad heuristics that can cause fresh position drift.
export const importedPositionOverrides: Record<string, PositionOverride> = {};
