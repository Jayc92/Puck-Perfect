import { sampleFranchises } from "./sampleFranchises";
import { samplePlayers } from "./samplePlayers";
import { legacyPlayers } from "./legacyPlayers";
import { sampleCoaches } from "./sampleCoaches";
import { importedPositionOverrides } from "./positionOverrides";
import type { Coach, Franchise, Player, PlayerPosition, TeamTenure } from "../types";

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

const SUPPORTED_DECADES = new Set([
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
]);

export const getFallbackPlayerDataset = (
  override?: Partial<Pick<PlayerDataset, "players" | "coaches" | "franchises">>,
): PlayerDataset => {
  const players = trimPlayersToSupportedDecades(
    override?.players ?? [...samplePlayers, ...legacyPlayers],
  );
  const coaches = trimCoachesToSupportedDecades(override?.coaches ?? sampleCoaches);
  const usedFranchiseIds = new Set([
    ...players.flatMap((player) => player.franchiseIds),
    ...coaches.flatMap((coach) => coach.franchiseIds),
  ]);

  return {
    players,
    coaches,
    franchises: (override?.franchises ?? sampleFranchises).filter((franchise) =>
      usedFranchiseIds.has(franchise.id),
    ),
    datasetLabel: "Sample modern-era NHL pool",
    isSample: true,
  };
};

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
        const players = trimPlayersToSupportedDecades(
          normalizeImportedPlayers(generated.players),
        );
        const coaches = trimCoachesToSupportedDecades(sampleCoaches);
        const usedFranchiseIds = new Set([
          ...players.flatMap((player) => player.franchiseIds),
          ...coaches.flatMap((coach) => coach.franchiseIds),
        ]);

        return {
          players,
          coaches,
          franchises: generated.franchises.filter((franchise) => usedFranchiseIds.has(franchise.id)),
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
      return applyImportedPositionOverride(player);
    }

    const goalsPerGame = (player.stats.goals ?? 0) / Math.max(player.stats.games, 1);
    const assistsPerGame = (player.stats.assists ?? 0) / Math.max(player.stats.games, 1);
    const pointsPerGame = (player.stats.points ?? 0) / Math.max(player.stats.games, 1);
    const totalPoints = player.stats.points ?? 0;
    const games = player.stats.games;

    const eligible = new Set<PlayerPosition>([player.primaryPosition, ...player.eligiblePositions]);

    if (player.primaryPosition === "LW" || player.primaryPosition === "RW") {
      eligible.add("LW");
      eligible.add("RW");
      eligible.delete("C");
    }

    if (player.primaryPosition === "C") {
      eligible.add("C");

      const eliteCenterCanFloatToWing =
        games >= 450 &&
        totalPoints >= 400 &&
        (pointsPerGame >= 0.82 || goalsPerGame >= 0.34 || assistsPerGame >= 0.5);
      const scoringCenterCanPlayRW =
        games >= 250 && totalPoints >= 180 && goalsPerGame >= 0.32;
      const playmakingCenterCanPlayLW =
        games >= 250 && totalPoints >= 180 && assistsPerGame >= 0.42;

      if (eliteCenterCanFloatToWing) {
        eligible.add("LW");
        eligible.add("RW");
      } else if (scoringCenterCanPlayRW && !playmakingCenterCanPlayLW) {
        eligible.add("RW");
      } else if (playmakingCenterCanPlayLW && !scoringCenterCanPlayRW) {
        eligible.add("LW");
      } else if (scoringCenterCanPlayRW && playmakingCenterCanPlayLW) {
        eligible.add("LW");
        eligible.add("RW");
      }
    }

    return applyImportedPositionOverride({
      ...player,
      eligiblePositions: [...eligible],
    });
  });
}

function applyImportedPositionOverride(player: Player) {
  const override = importedPositionOverrides[player.id];
  if (!override) {
    return player;
  }

  return {
    ...player,
    primaryPosition: override.primaryPosition ?? player.primaryPosition,
    eligiblePositions: override.eligiblePositions
      ? [...new Set(override.eligiblePositions)]
      : player.eligiblePositions,
  };
}

function trimPlayersToSupportedDecades(players: Player[]) {
  return players
    .map((player) => {
      const teams = trimTeamsToSupportedDecades(player.teams);
      const franchiseIds = player.franchiseIds.filter((franchiseId) =>
        teams.some((team) => team.franchiseId === franchiseId),
      );

      return {
        ...player,
        teams,
        franchiseIds,
      };
    })
    .filter((player) => player.teams.length > 0);
}

function trimCoachesToSupportedDecades(coaches: Coach[]) {
  return coaches
    .map((coach) => {
      const teams = trimTeamsToSupportedDecades(coach.teams);
      const franchiseIds = coach.franchiseIds.filter((franchiseId) =>
        teams.some((team) => team.franchiseId === franchiseId),
      );

      return {
        ...coach,
        teams,
        franchiseIds,
      };
    })
    .filter((coach) => coach.teams.length > 0);
}

function trimTeamsToSupportedDecades(teams: TeamTenure[]) {
  return teams
    .map((team) => ({
      ...team,
      decadeTags: team.decadeTags.filter((decadeTag) => SUPPORTED_DECADES.has(decadeTag)),
    }))
    .filter((team) => team.decadeTags.length > 0);
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
