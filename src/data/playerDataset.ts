import { sampleFranchises } from "./sampleFranchises";
import { samplePlayers } from "./samplePlayers";
import { legacyPlayers } from "./legacyPlayers";
import { sampleCoaches } from "./sampleCoaches";
import type { Coach, Franchise, Player, PlayerPosition } from "../types";

export type PlayerDataset = {
  players: Player[];
  coaches: Coach[];
  franchises: Franchise[];
  datasetLabel: string;
  isSample: boolean;
};

type GeneratedDatasetAsset = {
  meta: {
    builtAt: string | null;
    startSeasonId: number | null;
    endSeasonId: number | null;
    playerCount: number;
    franchiseCount: number;
  };
  players: Player[];
  franchises: Franchise[];
};

export const getFallbackPlayerDataset = (
  override?: Partial<Pick<PlayerDataset, "players" | "coaches" | "franchises">>,
): PlayerDataset => ({
  players: override?.players ?? [...samplePlayers, ...legacyPlayers],
  coaches: override?.coaches ?? sampleCoaches,
  franchises: override?.franchises ?? sampleFranchises,
  datasetLabel: "Sample all-time NHL pool",
  isSample: true,
});

export const loadPlayerDataset = async (
  override?: Partial<Pick<PlayerDataset, "players" | "coaches" | "franchises">>,
): Promise<PlayerDataset> => {
  if (override?.players || override?.coaches || override?.franchises) {
    return getFallbackPlayerDataset(override);
  }

  try {
    const response = await fetch("/data/nhl-dataset.json", {
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const generated = (await response.json()) as GeneratedDatasetAsset;
      const hasGeneratedData =
        generated.players.length > 0 && generated.franchises.length > 0;

      if (hasGeneratedData) {
        return {
          players: normalizeImportedPlayers(generated.players),
          coaches: sampleCoaches,
          franchises: generated.franchises,
          datasetLabel: `Imported NHL pool (${generated.meta.startSeasonId}-${generated.meta.endSeasonId})`,
          isSample: false,
        };
      }
    }
  } catch {
    // Fallback to the bundled sample roster when the generated asset is absent.
  }

  return getFallbackPlayerDataset();
};

function normalizeImportedPlayers(players: Player[]) {
  return players.map((player) => {
    if (player.primaryPosition === "D" || player.primaryPosition === "G") {
      return player;
    }

    const goalsPerGame = (player.stats.goals ?? 0) / Math.max(player.stats.games, 1);
    const assistsPerGame = (player.stats.assists ?? 0) / Math.max(player.stats.games, 1);
    const pointsPerGame = (player.stats.points ?? 0) / Math.max(player.stats.games, 1);

    const eligible = new Set<PlayerPosition>(player.eligiblePositions);

    if (player.primaryPosition === "LW" || player.primaryPosition === "RW") {
      eligible.add("LW");
      eligible.add("RW");

      if (pointsPerGame >= 0.95 && assistsPerGame >= 0.55) {
        eligible.add("C");
      }
    }

    if (player.primaryPosition === "C") {
      eligible.add("C");

      if (pointsPerGame >= 0.9 || goalsPerGame >= 0.36 || assistsPerGame >= 0.62) {
        eligible.add("LW");
        eligible.add("RW");
      } else if (goalsPerGame >= assistsPerGame) {
        eligible.add("RW");
      } else {
        eligible.add("LW");
      }
    }

    return {
      ...player,
      eligiblePositions: [...eligible],
    };
  });
}

export const findFranchiseByAlias = (
  franchises: Franchise[],
  name: string,
): Franchise | undefined => {
  const normalized = name.trim().toLowerCase();
  return franchises.find((franchise) =>
    [franchise.displayName, ...franchise.aliases].some(
      (alias) => alias.toLowerCase() === normalized,
    ),
  );
};
