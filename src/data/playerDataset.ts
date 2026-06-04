import { sampleFranchises } from "./sampleFranchises";
import { samplePlayers } from "./samplePlayers";
import { legacyPlayers } from "./legacyPlayers";
import type { Franchise, Player } from "../types";

export type PlayerDataset = {
  players: Player[];
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
  override?: Partial<Pick<PlayerDataset, "players" | "franchises">>,
): PlayerDataset => ({
  players: override?.players ?? [...samplePlayers, ...legacyPlayers],
  franchises: override?.franchises ?? sampleFranchises,
  datasetLabel: "Sample all-time NHL pool",
  isSample: true,
});

export const loadPlayerDataset = async (
  override?: Partial<Pick<PlayerDataset, "players" | "franchises">>,
): Promise<PlayerDataset> => {
  if (override?.players || override?.franchises) {
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
          players: generated.players,
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
