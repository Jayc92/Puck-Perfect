import {
  APP_STORAGE_KEY,
  APP_TUTORIAL_KEY,
  CURRENT_GAME_STATE_VERSION,
  LEGACY_APP_STORAGE_KEYS,
} from "./constants";
import type { PersistedGameState } from "../types";

const VALID_STATUSES = new Set([
  "intro",
  "ready",
  "spinning",
  "choosingPlayer",
  "assigningSlot",
  "complete",
  "results",
]);

const VALID_LINEUP_KEYS = ["LW", "C", "RW", "D1", "D2", "G"] as const;

const isPersistedGameState = (value: unknown): value is PersistedGameState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<PersistedGameState>;
  if (state.version !== CURRENT_GAME_STATE_VERSION) {
    return false;
  }

  if (!VALID_STATUSES.has(state.status as string)) {
    return false;
  }

  if (state.seasonGames !== 82 && state.seasonGames !== 84) {
    return false;
  }

  if (!state.lineup || typeof state.lineup !== "object") {
    return false;
  }

  const hasValidLineup = VALID_LINEUP_KEYS.every((slot) => {
    const playerId = state.lineup?.[slot];
    return typeof playerId === "string" || playerId === null;
  });

  return (
    hasValidLineup &&
    (typeof state.coachId === "string" || state.coachId === null) &&
    Array.isArray(state.draftedPlayerIds) &&
    (typeof state.lastPromptKey === "string" || state.lastPromptKey === null) &&
    typeof state.rngState === "number"
  );
};

export const loadSavedGame = (): PersistedGameState | null => {
  try {
    LEGACY_APP_STORAGE_KEYS.forEach((key) => {
      if (window.localStorage.getItem(key)) {
        window.localStorage.removeItem(key);
      }
    });

    const raw = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isPersistedGameState(parsed)) {
      window.localStorage.removeItem(APP_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(APP_STORAGE_KEY);
    return null;
  }
};

export const saveGame = (state: PersistedGameState) => {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
};

export const clearSavedGame = () => {
  window.localStorage.removeItem(APP_STORAGE_KEY);
};

export const loadTutorialHidden = () => {
  try {
    return window.localStorage.getItem(APP_TUTORIAL_KEY) === "true";
  } catch {
    return false;
  }
};

export const saveTutorialHidden = (hidden: boolean) => {
  window.localStorage.setItem(APP_TUTORIAL_KEY, hidden ? "true" : "false");
};
