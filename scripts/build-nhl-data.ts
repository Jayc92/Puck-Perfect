import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type PlayerPosition = "LW" | "C" | "RW" | "D" | "G";

type TeamTenure = {
  franchiseId: string;
  teamName: string;
  startSeason: number;
  endSeason: number;
  decadeTags: string[];
};

type Player = {
  id: string;
  name: string;
  primaryPosition: PlayerPosition;
  eligiblePositions: PlayerPosition[];
  franchiseIds: string[];
  teams: TeamTenure[];
  stats: {
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
  awards?: string[];
  eraNotes?: string;
  roleTag: string;
  sourceQuality: "sample" | "imported" | "verified";
};

type Franchise = {
  id: string;
  displayName: string;
  aliases: string[];
  active: boolean;
};

type TeamApiRow = {
  id?: number;
  franchiseId?: number | null;
  fullName?: string;
  triCode?: string;
  rawTricode?: string;
};

type StatsApiResponse<T> = {
  data?: T[];
  total?: number;
};

type RawStatsRow = Record<string, unknown>;

type FranchiseEntry = Franchise & {
  nhlFranchiseId: number;
  historicalTeamNames: Set<string>;
};

type FranchiseCatalog = {
  franchises: Map<number, FranchiseEntry>;
  triCodeToFranchiseId: Map<string, number>;
  triCodeToTeamName: Map<string, string>;
};

type TeamSeasonEntry = {
  franchiseKey: string;
  teamName: string;
  seasonId: number;
  games: number;
  points: number;
  wins: number;
};

type AggregateAccumulator = {
  playerId: string;
  name: string;
  primaryPosition: PlayerPosition;
  eligiblePositions: Set<PlayerPosition>;
  franchiseKeys: Set<string>;
  teamSeasons: Map<string, TeamSeasonEntry[]>;
  stats: {
    games: number;
    goals: number;
    assists: number;
    points: number;
    plusMinus: number;
    shots: number;
    penaltyMinutes: number;
    goalieWins: number;
    goalieLosses: number;
    goalieTiesOt: number;
    savePctNumerator: number;
    savePctWeight: number;
    gaaNumerator: number;
    gaaWeight: number;
    shutouts: number;
  };
};

type CliOptions = {
  startSeasonId: number;
  endSeasonId: number;
  outputPath: string;
  minSkaterGames: number;
  minSkaterPoints: number;
  minGoalieGames: number;
  minGoalieWins: number;
  pageSize: number;
};

type CanonicalFranchise = {
  id: string;
  displayName: string;
  aliases: string[];
};

const API_BASE = "https://api.nhle.com/stats/rest/en";
const DEFAULT_MIN_SKATER_GAMES = 40;
const DEFAULT_MIN_SKATER_POINTS = 80;
const DEFAULT_MIN_GOALIE_GAMES = 30;
const DEFAULT_MIN_GOALIE_WINS = 20;
const DEFAULT_PAGE_SIZE = 500;
const MIN_DECADE_SKATER_GAMES = 20;
const MIN_DECADE_FORWARD_POINTS = 15;
const MIN_DECADE_DEFENSE_POINTS = 10;
const MIN_DECADE_GOALIE_GAMES = 8;
const MIN_DECADE_GOALIE_WINS = 5;
const CANONICAL_FRANCHISES: CanonicalFranchise[] = [
  { id: "anaheim-ducks", displayName: "Anaheim Ducks", aliases: ["Anaheim Ducks", "Mighty Ducks of Anaheim"] },
  { id: "boston-bruins", displayName: "Boston Bruins", aliases: ["Boston Bruins"] },
  { id: "buffalo-sabres", displayName: "Buffalo Sabres", aliases: ["Buffalo Sabres"] },
  { id: "calgary-flames", displayName: "Calgary Flames", aliases: ["Calgary Flames", "Atlanta Flames"] },
  { id: "carolina-hurricanes", displayName: "Carolina Hurricanes", aliases: ["Carolina Hurricanes", "Hartford Whalers"] },
  { id: "chicago-blackhawks", displayName: "Chicago Blackhawks", aliases: ["Chicago Black Hawks", "Chicago Blackhawks"] },
  { id: "colorado-avalanche", displayName: "Colorado Avalanche", aliases: ["Colorado Avalanche", "Quebec Nordiques"] },
  { id: "columbus-blue-jackets", displayName: "Columbus Blue Jackets", aliases: ["Columbus Blue Jackets"] },
  { id: "dallas-stars", displayName: "Dallas Stars", aliases: ["Dallas Stars", "Minnesota North Stars"] },
  { id: "detroit-red-wings", displayName: "Detroit Red Wings", aliases: ["Detroit Red Wings", "Detroit Cougars", "Detroit Falcons"] },
  { id: "edmonton-oilers", displayName: "Edmonton Oilers", aliases: ["Edmonton Oilers"] },
  { id: "florida-panthers", displayName: "Florida Panthers", aliases: ["Florida Panthers"] },
  { id: "los-angeles-kings", displayName: "Los Angeles Kings", aliases: ["Los Angeles Kings"] },
  { id: "minnesota-wild", displayName: "Minnesota Wild", aliases: ["Minnesota Wild"] },
  { id: "montreal-canadiens", displayName: "Montreal Canadiens", aliases: ["Montreal Canadiens", "Montréal Canadiens"] },
  { id: "nashville-predators", displayName: "Nashville Predators", aliases: ["Nashville Predators"] },
  { id: "new-jersey-devils", displayName: "New Jersey Devils", aliases: ["New Jersey Devils", "Colorado Rockies", "Kansas City Scouts"] },
  { id: "new-york-islanders", displayName: "New York Islanders", aliases: ["New York Islanders", "NY Islanders"] },
  { id: "new-york-rangers", displayName: "New York Rangers", aliases: ["New York Rangers", "NY Rangers"] },
  { id: "ottawa-senators", displayName: "Ottawa Senators", aliases: ["Ottawa Senators"] },
  { id: "philadelphia-flyers", displayName: "Philadelphia Flyers", aliases: ["Philadelphia Flyers"] },
  { id: "pittsburgh-penguins", displayName: "Pittsburgh Penguins", aliases: ["Pittsburgh Penguins"] },
  { id: "san-jose-sharks", displayName: "San Jose Sharks", aliases: ["San Jose Sharks"] },
  { id: "seattle-kraken", displayName: "Seattle Kraken", aliases: ["Seattle Kraken"] },
  { id: "st-louis-blues", displayName: "St. Louis Blues", aliases: ["St. Louis Blues", "St Louis Blues"] },
  { id: "tampa-bay-lightning", displayName: "Tampa Bay Lightning", aliases: ["Tampa Bay Lightning"] },
  { id: "toronto-maple-leafs", displayName: "Toronto Maple Leafs", aliases: ["Toronto Maple Leafs", "Toronto St. Patricks", "Toronto St Patricks", "Toronto Arenas"] },
  { id: "utah", displayName: "Utah", aliases: ["Utah", "Utah Hockey Club", "Utah Mammoth", "Arizona Coyotes", "Phoenix Coyotes"] },
  { id: "vancouver-canucks", displayName: "Vancouver Canucks", aliases: ["Vancouver Canucks"] },
  { id: "vegas-golden-knights", displayName: "Vegas Golden Knights", aliases: ["Vegas Golden Knights"] },
  { id: "washington-capitals", displayName: "Washington Capitals", aliases: ["Washington Capitals"] },
  { id: "winnipeg-jets", displayName: "Winnipeg Jets", aliases: ["Winnipeg Jets", "Atlanta Thrashers"] },
];

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const seasonIds = buildSeasonIds(options.startSeasonId, options.endSeasonId);

  console.log(
    `Building NHL dataset for ${seasonIds.length} seasons (${options.startSeasonId} -> ${options.endSeasonId})...`,
  );

  const franchiseCatalog = await fetchFranchises();
  const accumulators = new Map<string, AggregateAccumulator>();

  for (const seasonId of seasonIds) {
    console.log(`Fetching season ${seasonId} skaters...`);
    const skaters = await fetchStatsRows("skater/summary", {
      cayenneExp: `seasonId=${seasonId} and gameTypeId=2`,
      sort: "points",
      dir: "DESC",
      pageSize: options.pageSize,
    });

    console.log(`Fetching season ${seasonId} goalies...`);
    const goalies = await fetchStatsRows("goalie/summary", {
      cayenneExp: `seasonId=${seasonId} and gameTypeId=2`,
      sort: "wins",
      dir: "DESC",
      pageSize: options.pageSize,
    });

    mergeSkaters(accumulators, skaters, franchiseCatalog, seasonId);
    mergeGoalies(accumulators, goalies, franchiseCatalog, seasonId);
  }

  const players = finalizePlayers(accumulators, options);
  const filteredFranchises = finalizeFranchises(franchiseCatalog.franchises, players);

  const fileContents = renderGeneratedDataset({
    builtAt: new Date().toISOString(),
    startSeasonId: options.startSeasonId,
    endSeasonId: options.endSeasonId,
    playerCount: players.length,
    franchiseCount: filteredFranchises.length,
    players,
    franchises: filteredFranchises,
  });

  await mkdir(path.dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, fileContents, "utf8");

  console.log(
    `Wrote ${players.length} players and ${filteredFranchises.length} franchises to ${options.outputPath}`,
  );
}

function parseCliArgs(args: string[]): CliOptions {
  const optionMap = new Map<string, string>();
  args.forEach((arg) => {
    if (!arg.startsWith("--")) {
      return;
    }
    const [key, value] = arg.slice(2).split("=");
    if (key && value) {
      optionMap.set(key, value);
    }
  });

  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const startSeasonId = parseSeasonId(optionMap.get("start-season")) ?? 19601961;
  const endSeasonId = parseSeasonId(optionMap.get("end-season")) ?? getCurrentSeasonId();
  const outputPath = optionMap.get("output")
    ? path.resolve(rootDir, optionMap.get("output")!)
    : path.resolve(rootDir, "public/data/nhl-dataset.json");
  const legacyMinGames = parseInteger(optionMap.get("min-games"));
  const minSkaterGames =
    parseInteger(optionMap.get("min-skater-games")) ??
    legacyMinGames ??
    DEFAULT_MIN_SKATER_GAMES;
  const minSkaterPoints =
    parseInteger(optionMap.get("min-skater-points")) ??
    DEFAULT_MIN_SKATER_POINTS;
  const minGoalieGames =
    parseInteger(optionMap.get("min-goalie-games")) ??
    legacyMinGames ??
    DEFAULT_MIN_GOALIE_GAMES;
  const minGoalieWins =
    parseInteger(optionMap.get("min-goalie-wins")) ??
    DEFAULT_MIN_GOALIE_WINS;
  const pageSize = parseInteger(optionMap.get("page-size")) ?? DEFAULT_PAGE_SIZE;

  if (startSeasonId > endSeasonId) {
    throw new Error(`start-season ${startSeasonId} cannot be greater than end-season ${endSeasonId}`);
  }

  return {
    startSeasonId,
    endSeasonId,
    outputPath,
    minSkaterGames,
    minSkaterPoints,
    minGoalieGames,
    minGoalieWins,
    pageSize,
  };
}

function parseSeasonId(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace("-", "");
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || normalized.length !== 8) {
    throw new Error(`Invalid season id "${value}". Expected format like 19601961 or 1960-1961.`);
  }

  return parsed;
}

function parseInteger(value?: string) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value "${value}"`);
  }
  return parsed;
}

function getCurrentSeasonId() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const seasonStartYear = month >= 7 ? year : year - 1;
  return Number(`${seasonStartYear}${seasonStartYear + 1}`);
}

function buildSeasonIds(startSeasonId: number, endSeasonId: number) {
  const seasonIds: number[] = [];
  let current = startSeasonId;
  while (current <= endSeasonId) {
    seasonIds.push(current);
    const startYear = Number(String(current).slice(0, 4)) + 1;
    current = Number(`${startYear}${startYear + 1}`);
  }
  return seasonIds;
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PuckPerfectDataBuilder/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url.toString()} with ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchFranchises() {
  const url = new URL(`${API_BASE}/team`);
  const payload = await fetchJson<StatsApiResponse<TeamApiRow>>(url);
  const byFranchise = new Map<number, FranchiseEntry>();
  const triCodeToFranchiseId = new Map<string, number>();
  const triCodeToTeamName = new Map<string, string>();

  for (const row of payload.data ?? []) {
    if (typeof row.franchiseId !== "number" || !row.fullName) {
      continue;
    }

    const canonical = findCanonicalFranchise(row.fullName);
    const existing = byFranchise.get(row.franchiseId);
    if (existing) {
      if (canonical) {
        existing.id = canonical.id;
        existing.displayName = canonical.displayName;
        existing.aliases.push(...canonical.aliases);
      }
      existing.active = existing.active || !isHistoricalInactiveTeam(row.fullName);
      existing.historicalTeamNames.add(row.fullName);
      if (row.triCode) {
        existing.aliases.push(row.triCode);
        triCodeToFranchiseId.set(row.triCode, row.franchiseId);
        triCodeToTeamName.set(row.triCode, row.fullName);
      }
      if (row.rawTricode) {
        triCodeToFranchiseId.set(row.rawTricode, row.franchiseId);
        triCodeToTeamName.set(row.rawTricode, row.fullName);
      }
      continue;
    }

    const displayName = canonical?.displayName ?? inferDisplayName(row.fullName);
    const aliases = new Set<string>([
      row.fullName,
      displayName,
      row.triCode ?? "",
      row.rawTricode ?? "",
      ...(canonical?.aliases ?? []),
    ].filter(Boolean));

    byFranchise.set(row.franchiseId, {
      id: canonical?.id ?? slugify(displayName),
      displayName,
      aliases: [...aliases],
      active: !isHistoricalInactiveTeam(row.fullName),
      nhlFranchiseId: row.franchiseId,
      historicalTeamNames: new Set([row.fullName]),
    });

    if (row.triCode) {
      triCodeToFranchiseId.set(row.triCode, row.franchiseId);
      triCodeToTeamName.set(row.triCode, row.fullName);
    }
    if (row.rawTricode) {
      triCodeToFranchiseId.set(row.rawTricode, row.franchiseId);
      triCodeToTeamName.set(row.rawTricode, row.fullName);
    }
  }

  return {
    franchises: byFranchise,
    triCodeToFranchiseId,
    triCodeToTeamName,
  };
}

function findCanonicalFranchise(fullName: string) {
  const normalized = normalizeFranchiseName(fullName).toLowerCase();

  return CANONICAL_FRANCHISES.find((franchise) =>
    franchise.aliases.some(
      (alias) => normalizeFranchiseName(alias).toLowerCase() === normalized,
    ),
  );
}

function inferDisplayName(fullName: string) {
  return normalizeFranchiseName(fullName);
}

function normalizeFranchiseName(fullName: string) {
  return fullName
    .replace(/\s+\(\d{4}\)/g, "")
    .replace(/^St Louis$/, "St. Louis")
    .trim();
}

function isHistoricalInactiveTeam(fullName: string) {
  return /(Arenas|St\. Patricks|Bulldogs|Maroons|Wanderers|Americans|Cougars|Falcons|Pirates|Quakers|Eagles|Scouts|Barons|Golden Seals|Seals|Rockies)/i.test(
    fullName,
  );
}

async function fetchStatsRows(
  endpoint: "skater/summary" | "goalie/summary",
  options: {
    cayenneExp: string;
    sort: string;
    dir: "ASC" | "DESC";
    pageSize: number;
  },
) {
  const rows: RawStatsRow[] = [];
  let start = 0;

  while (true) {
    const url = new URL(`${API_BASE}/${endpoint}`);
    url.searchParams.set("isAggregate", "false");
    url.searchParams.set("isGame", "false");
    url.searchParams.set("sort", options.sort);
    url.searchParams.set("dir", options.dir);
    url.searchParams.set("start", String(start));
    url.searchParams.set("limit", String(options.pageSize));
    url.searchParams.set("cayenneExp", options.cayenneExp);

    const payload = await fetchJson<StatsApiResponse<RawStatsRow>>(url);
    const pageRows = payload.data ?? [];

    rows.push(...pageRows);
    if (pageRows.length === 0) {
      break;
    }
    start += pageRows.length;
    if (typeof payload.total === "number" && rows.length >= payload.total) {
      break;
    }
  }

  return rows;
}

function mergeSkaters(
  accumulators: Map<string, AggregateAccumulator>,
  rows: RawStatsRow[],
  franchiseCatalog: FranchiseCatalog,
  seasonId: number,
) {
  for (const row of rows) {
    const playerId = String(getNumber(row, ["playerId", "skaterPlayerId"]) ?? "");
    const name =
      getString(row, ["skaterFullName", "playerName"]) ??
      joinNames(getString(row, ["firstName"]), getString(row, ["lastName"]));
    const position = mapSkaterPosition(
      getString(row, ["positionCode", "position"]),
      name,
    );
    const franchises = resolveFranchisesForRow(row, franchiseCatalog);
    const gamesPlayed = getNumber(row, ["gamesPlayed"]) ?? 0;
    const goals = getNumber(row, ["goals"]) ?? 0;
    const assists = getNumber(row, ["assists"]) ?? 0;
    const points = getNumber(row, ["points"]) ?? 0;
    const plusMinus = getNumber(row, ["plusMinus"]) ?? 0;
    const shots = getNumber(row, ["shots"]) ?? 0;
    const penaltyMinutes = getNumber(row, ["penaltyMinutes", "pim"]) ?? 0;

    if (!playerId || !name || !franchises.length || !position) {
      continue;
    }

    const accumulator = getOrCreateAccumulator(accumulators, {
      playerId,
      name,
      primaryPosition: position.primary,
      eligiblePositions: position.eligible,
    });

    accumulator.primaryPosition = accumulator.primaryPosition === "G" ? position.primary : accumulator.primaryPosition;
    position.eligible.forEach((eligiblePosition) => accumulator.eligiblePositions.add(eligiblePosition));
    const franchiseShare = 1 / franchises.length;
    franchises.forEach((franchise) => {
      accumulator.franchiseKeys.add(franchise.id);
      appendTeamSeason(accumulator, franchise.id, {
        franchiseKey: franchise.id,
        teamName: resolveRowTeamName(row, franchiseCatalog, franchise),
        seasonId,
        games: gamesPlayed * franchiseShare,
        points: points * franchiseShare,
        wins: 0,
      });
    });

    accumulator.stats.games += gamesPlayed;
    accumulator.stats.goals += goals;
    accumulator.stats.assists += assists;
    accumulator.stats.points += points;
    accumulator.stats.plusMinus += plusMinus;
    accumulator.stats.shots += shots;
    accumulator.stats.penaltyMinutes += penaltyMinutes;
  }
}

function mergeGoalies(
  accumulators: Map<string, AggregateAccumulator>,
  rows: RawStatsRow[],
  franchiseCatalog: FranchiseCatalog,
  seasonId: number,
) {
  for (const row of rows) {
    const playerId = String(getNumber(row, ["playerId", "goaliePlayerId"]) ?? "");
    const name =
      getString(row, ["goalieFullName", "playerName"]) ??
      joinNames(getString(row, ["firstName"]), getString(row, ["lastName"]));
    const franchises = resolveFranchisesForRow(row, franchiseCatalog);

    if (!playerId || !name || !franchises.length) {
      continue;
    }

    const accumulator = getOrCreateAccumulator(accumulators, {
      playerId,
      name,
      primaryPosition: "G",
      eligiblePositions: ["G"],
    });

    accumulator.eligiblePositions.add("G");
    accumulator.primaryPosition = "G";

    const gamesPlayed = getNumber(row, ["gamesPlayed"]) ?? 0;
    const savePct = getNumber(row, ["savePct", "savePercentage"]) ?? 0;
    const gaa = getNumber(row, ["goalsAgainstAverage", "gaa"]) ?? 0;
    const wins = getNumber(row, ["wins"]) ?? 0;
    const losses = getNumber(row, ["losses"]) ?? 0;
    const tiesOt =
      (getNumber(row, ["ties"]) ?? 0) + (getNumber(row, ["otLosses", "overtimeLosses"]) ?? 0);
    const shutouts = getNumber(row, ["shutouts"]) ?? 0;
    const franchiseShare = 1 / franchises.length;

    franchises.forEach((franchise) => {
      accumulator.franchiseKeys.add(franchise.id);
      appendTeamSeason(accumulator, franchise.id, {
        franchiseKey: franchise.id,
        teamName: resolveRowTeamName(row, franchiseCatalog, franchise),
        seasonId,
        games: gamesPlayed * franchiseShare,
        points: 0,
        wins: wins * franchiseShare,
      });
    });

    accumulator.stats.games += gamesPlayed;
    accumulator.stats.goalieWins += wins;
    accumulator.stats.goalieLosses += losses;
    accumulator.stats.goalieTiesOt += tiesOt;
    accumulator.stats.shutouts += shutouts;
    accumulator.stats.savePctNumerator += savePct * gamesPlayed;
    accumulator.stats.savePctWeight += gamesPlayed;
    accumulator.stats.gaaNumerator += gaa * gamesPlayed;
    accumulator.stats.gaaWeight += gamesPlayed;
  }
}

function getOrCreateAccumulator(
  accumulators: Map<string, AggregateAccumulator>,
  options: {
    playerId: string;
    name: string;
    primaryPosition: PlayerPosition;
    eligiblePositions: PlayerPosition[];
  },
) {
  const existing = accumulators.get(options.playerId);
  if (existing) {
    return existing;
  }

  const created: AggregateAccumulator = {
    playerId: options.playerId,
    name: options.name,
    primaryPosition: options.primaryPosition,
    eligiblePositions: new Set(options.eligiblePositions),
    franchiseKeys: new Set<string>(),
    teamSeasons: new Map<string, TeamSeasonEntry[]>(),
    stats: {
      games: 0,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      shots: 0,
      penaltyMinutes: 0,
      goalieWins: 0,
      goalieLosses: 0,
      goalieTiesOt: 0,
      savePctNumerator: 0,
      savePctWeight: 0,
      gaaNumerator: 0,
      gaaWeight: 0,
      shutouts: 0,
    },
  };

  accumulators.set(options.playerId, created);
  return created;
}

function appendTeamSeason(
  accumulator: AggregateAccumulator,
  franchiseKey: string,
  entry: TeamSeasonEntry,
) {
  const entries = accumulator.teamSeasons.get(franchiseKey) ?? [];
  const existing = entries.find(
    (season) => season.seasonId === entry.seasonId && season.teamName === entry.teamName,
  );
  if (existing) {
    existing.games += entry.games;
    existing.points += entry.points;
    existing.wins += entry.wins;
  } else {
    entries.push(entry);
  }
  accumulator.teamSeasons.set(franchiseKey, entries);
}

function finalizePlayers(
  accumulators: Map<string, AggregateAccumulator>,
  options: Pick<
    CliOptions,
    "minSkaterGames" | "minSkaterPoints" | "minGoalieGames" | "minGoalieWins"
  >,
) {
  const players: Player[] = [];
  const seenIds = new Set<string>();

  for (const accumulator of accumulators.values()) {
    const isGoalie = accumulator.primaryPosition === "G";
    const qualifies = isGoalie
      ? accumulator.stats.games >= options.minGoalieGames ||
        accumulator.stats.goalieWins >= options.minGoalieWins
      : accumulator.stats.games >= options.minSkaterGames ||
        accumulator.stats.points >= options.minSkaterPoints;

    if (!qualifies) {
      continue;
    }

    const teams = [...accumulator.teamSeasons.entries()]
      .map(([franchiseKey, seasons]) => {
        const seasonIds = seasons.map((season) => season.seasonId).sort((left, right) => left - right);
        const teamName = seasons[seasons.length - 1]?.teamName ?? franchiseKey;
        const startSeason = Number(String(seasonIds[0]).slice(0, 4));
        const endSeason = Number(String(seasonIds[seasonIds.length - 1]).slice(0, 4));
        const decadeTags = buildQualifiedDecadeTags(
          seasons,
          accumulator.primaryPosition,
        );

        return {
          franchiseId: franchiseKey,
          teamName,
          startSeason,
          endSeason,
          decadeTags,
        };
      })
      .filter((team) => team.decadeTags.length > 0)
      .sort((left, right) => left.startSeason - right.startSeason);

    if (!teams.length) {
      continue;
    }

    const roleTag = buildRoleTag(accumulator);
    const player: Player = {
      id: buildPlayerSlug(accumulator.name, accumulator.playerId, seenIds),
      name: accumulator.name,
      primaryPosition: accumulator.primaryPosition,
      eligiblePositions: [...accumulator.eligiblePositions],
      franchiseIds: [...accumulator.franchiseKeys],
      teams,
      stats: {
        games: accumulator.stats.games,
        goals: isGoalie ? undefined : accumulator.stats.goals,
        assists: isGoalie ? undefined : accumulator.stats.assists,
        points: isGoalie ? undefined : accumulator.stats.points,
        plusMinus: isGoalie ? undefined : normalizeOptionalStat(accumulator.stats.plusMinus),
        shots: isGoalie ? undefined : normalizeOptionalStat(accumulator.stats.shots),
        penaltyMinutes: isGoalie ? undefined : normalizeOptionalStat(accumulator.stats.penaltyMinutes),
        goalieWins: isGoalie ? accumulator.stats.goalieWins : undefined,
        goalieLosses: isGoalie ? accumulator.stats.goalieLosses : undefined,
        goalieTiesOt: isGoalie ? accumulator.stats.goalieTiesOt : undefined,
        savePct:
          isGoalie && accumulator.stats.savePctWeight > 0
            ? round(accumulator.stats.savePctNumerator / accumulator.stats.savePctWeight, 3)
            : undefined,
        gaa:
          isGoalie && accumulator.stats.gaaWeight > 0
            ? round(accumulator.stats.gaaNumerator / accumulator.stats.gaaWeight, 2)
            : undefined,
        shutouts: isGoalie ? accumulator.stats.shutouts : undefined,
      },
      eraNotes: isGoalie
        ? undefined
        : teams.some((team) => team.startSeason < 1980)
          ? "Historical defensive inputs may be partially estimated because older season-level tracking is incomplete."
          : undefined,
      roleTag,
      sourceQuality: "imported",
    };

    players.push(player);
  }

  return players.sort((left, right) => {
    const leftPoints = left.stats.points ?? left.stats.goalieWins ?? 0;
    const rightPoints = right.stats.points ?? right.stats.goalieWins ?? 0;
    return rightPoints - leftPoints;
  });
}

function buildPlayerSlug(name: string, playerId: string, seenIds: Set<string>) {
  const baseSlug = slugify(name);
  if (!seenIds.has(baseSlug)) {
    seenIds.add(baseSlug);
    return baseSlug;
  }

  const fallbackSlug = `${baseSlug}-${playerId}`;
  seenIds.add(fallbackSlug);
  return fallbackSlug;
}

function finalizeFranchises(
  franchises: Map<number, FranchiseEntry>,
  players: Player[],
) {
  const usedFranchiseIds = new Set(players.flatMap((player) => player.franchiseIds));
  const deduped = new Map<string, Franchise>();

  [...franchises.values()]
    .filter((franchise) => usedFranchiseIds.has(franchise.id))
    .forEach(({ historicalTeamNames, nhlFranchiseId, ...franchise }) => {
      const existing = deduped.get(franchise.id);
      const aliases = [...new Set([...franchise.aliases, ...historicalTeamNames])].sort();

      if (existing) {
        deduped.set(franchise.id, {
          ...existing,
          active: existing.active || franchise.active,
          aliases: [...new Set([...existing.aliases, ...aliases])].sort(),
        });
        return;
      }

      deduped.set(franchise.id, {
        ...franchise,
        aliases,
      });
    });

  return [...deduped.values()].sort((left, right) => left.displayName.localeCompare(right.displayName));
}

function buildDecadeTags(startSeason: number, endSeason: number) {
  const tags: string[] = [];
  for (let year = startSeason; year <= endSeason; year += 1) {
    const tag = `${Math.floor(year / 10) * 10}s`;
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

function buildQualifiedDecadeTags(
  seasons: TeamSeasonEntry[],
  primaryPosition: PlayerPosition,
) {
  const decadeTotals = new Map<string, { games: number; points: number; wins: number }>();

  seasons.forEach((season) => {
    const decade = `${Math.floor(Number(String(season.seasonId).slice(0, 4)) / 10) * 10}s`;
    const existing = decadeTotals.get(decade) ?? { games: 0, points: 0, wins: 0 };
    existing.games += season.games;
    existing.points += season.points;
    existing.wins += season.wins;
    decadeTotals.set(decade, existing);
  });

  return [...decadeTotals.entries()]
    .filter(([, totals]) => {
      if (primaryPosition === "G") {
        return (
          totals.games >= MIN_DECADE_GOALIE_GAMES ||
          totals.wins >= MIN_DECADE_GOALIE_WINS
        );
      }

      const pointThreshold =
        primaryPosition === "D" ? MIN_DECADE_DEFENSE_POINTS : MIN_DECADE_FORWARD_POINTS;

      return (
        totals.games >= MIN_DECADE_SKATER_GAMES ||
        totals.points >= pointThreshold
      );
    })
    .map(([decade]) => decade)
    .sort();
}

function mapSkaterPosition(positionCode: string | null, playerName: string) {
  switch ((positionCode ?? "").toUpperCase()) {
    case "C":
      return { primary: "C" as const, eligible: ["C"] as PlayerPosition[] };
    case "L":
    case "LW":
      return { primary: "LW" as const, eligible: ["LW"] as PlayerPosition[] };
    case "R":
    case "RW":
      return { primary: "RW" as const, eligible: ["RW"] as PlayerPosition[] };
    case "D":
      return { primary: "D" as const, eligible: ["D"] as PlayerPosition[] };
    case "W":
      return { primary: inferWingSideFromName(playerName), eligible: ["LW", "RW"] as PlayerPosition[] };
    default:
      return null;
  }
}

function inferWingSideFromName(name: string): "LW" | "RW" {
  return slugify(name).charCodeAt(0) % 2 === 0 ? "LW" : "RW";
}

function buildRoleTag(accumulator: AggregateAccumulator) {
  const games = Math.max(accumulator.stats.games, 1);

  if (accumulator.primaryPosition === "G") {
    const savePct = accumulator.stats.savePctWeight > 0
      ? accumulator.stats.savePctNumerator / accumulator.stats.savePctWeight
      : 0;
    if (savePct >= 0.918) {
      return "Elite Stopper";
    }
    if (accumulator.stats.goalieWins / games >= 0.55) {
      return "Workhorse Goalie";
    }
    return "Steady Goalie";
  }

  if (accumulator.primaryPosition === "D") {
    const pointsPerGame = accumulator.stats.points / games;
    const plusMinusPerGame = accumulator.stats.plusMinus / games;
    if (pointsPerGame >= 0.7) {
      return "Offensive D";
    }
    if (plusMinusPerGame >= 0.25) {
      return "Shutdown D";
    }
    return "Minute-Eater";
  }

  const goalsPerGame = accumulator.stats.goals / games;
  const assistsPerGame = accumulator.stats.assists / games;
  const pointsPerGame = accumulator.stats.points / games;

  if (goalsPerGame >= 0.45) {
    return "Sniper";
  }
  if (assistsPerGame >= 0.6) {
    return "Playmaker";
  }
  if (pointsPerGame >= 1) {
    return "Star Forward";
  }
  return "Two-Way Forward";
}

function renderGeneratedDataset(payload: {
  builtAt: string;
  startSeasonId: number;
  endSeasonId: number;
  playerCount: number;
  franchiseCount: number;
  players: Player[];
  franchises: Franchise[];
}) {
  return `${JSON.stringify(
    {
      meta: {
        builtAt: payload.builtAt,
        startSeasonId: payload.startSeasonId,
        endSeasonId: payload.endSeasonId,
        playerCount: payload.playerCount,
        franchiseCount: payload.franchiseCount,
      },
      players: payload.players,
      franchises: payload.franchises,
    },
    null,
    2,
  )}
`;
}

function getString(row: RawStatsRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function getNumber(row: RawStatsRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function joinNames(firstName: string | null, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || null;
}

function splitTeamTokens(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\s/|;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function resolveFranchisesForRow(
  row: RawStatsRow,
  franchiseCatalog: FranchiseCatalog,
) {
  const franchiseIds = new Set<number>();
  const directFranchiseId = getNumber(row, ["franchiseId"]);
  if (directFranchiseId) {
    franchiseIds.add(directFranchiseId);
  }

  splitTeamTokens(getString(row, ["teamAbbrevs", "teamAbbrev"])).forEach((token) => {
    const franchiseId = franchiseCatalog.triCodeToFranchiseId.get(token);
    if (franchiseId) {
      franchiseIds.add(franchiseId);
    }
  });

  const teamName = getString(row, ["teamFullName", "teamName"]);
  if (teamName) {
    const normalized = normalizeFranchiseName(teamName).toLowerCase();
    [...franchiseCatalog.franchises.entries()].forEach(([franchiseId, franchise]) => {
      const matchesName =
        normalizeFranchiseName(franchise.displayName).toLowerCase() === normalized ||
        franchise.aliases.some(
          (alias) => normalizeFranchiseName(alias).toLowerCase() === normalized,
        ) ||
        [...franchise.historicalTeamNames].some(
          (name) => normalizeFranchiseName(name).toLowerCase() === normalized,
        );

      if (matchesName) {
        franchiseIds.add(franchiseId);
      }
    });
  }

  return [...franchiseIds]
    .map((franchiseId) => franchiseCatalog.franchises.get(franchiseId))
    .filter((franchise): franchise is FranchiseEntry => Boolean(franchise));
}

function resolveRowTeamName(
  row: RawStatsRow,
  franchiseCatalog: FranchiseCatalog,
  franchise: FranchiseEntry,
) {
  const explicitName = getString(row, ["teamFullName", "teamName"]);
  if (explicitName && !/[,/|;]/.test(explicitName)) {
    return explicitName;
  }

  const matchingAlias = splitTeamTokens(getString(row, ["teamAbbrevs", "teamAbbrev"]))
    .find((token) => franchiseCatalog.triCodeToFranchiseId.get(token) === franchise.nhlFranchiseId);

  if (matchingAlias) {
    return franchiseCatalog.triCodeToTeamName.get(matchingAlias) ?? franchise.displayName;
  }

  return explicitName ?? franchise.displayName;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeOptionalStat(value: number) {
  return value === 0 ? undefined : value;
}

function round(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
