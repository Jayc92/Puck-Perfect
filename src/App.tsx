import { useEffect, useMemo, useState } from "react";
import { CoachCard } from "./components/CoachCard";
import { DraftSpinner } from "./components/DraftSpinner";
import { Header } from "./components/Header";
import { HowToPlayModal } from "./components/HowToPlayModal";
import { IntroPanel } from "./components/IntroPanel";
import { LineupBoard } from "./components/LineupBoard";
import { PlayerCard } from "./components/PlayerCard";
import { PrivacyPolicyModal } from "./components/PrivacyPolicyModal";
import { ResultPanel } from "./components/ResultPanel";
import { SeasonLengthToggle } from "./components/SeasonLengthToggle";
import { SiteFooter } from "./components/SiteFooter";
import {
  getFallbackPlayerDataset,
  loadPlayerDataset,
  type PlayerDataset,
} from "./data/playerDataset";
import {
  assignPlayerToSlot,
  buildDraftPrompt,
  createInitialLineup,
  getPromptKey,
  isRosterComplete,
  parseShareCode,
} from "./lib/draft";
import {
  CURRENT_GAME_STATE_VERSION,
  EMPTY_LINEUP,
  LINEUP_SLOTS,
} from "./lib/constants";
import {
  calculateCoachRating,
  calculatePlayerRating,
} from "./lib/scoring";
import {
  clearSavedGame,
  loadSavedGame,
  loadTutorialHidden,
  saveGame,
  saveTutorialHidden,
} from "./lib/storage";
import { simulateSeason } from "./lib/simulation";
import {
  getCoachById,
  getEligibleLineupSlots,
  getPlayerById,
  hashString,
} from "./lib/utils";
import type {
  Coach,
  DraftPrompt,
  GameStatus,
  LineupAssignment,
  PersistedGameState,
  Player,
  PlayerPosition,
  SeasonResult,
} from "./types";

type PlayerPoolFilter = "ALL" | "F" | "D" | "G" | "OPEN";
type PlayerPoolSort = "bestFit" | "points" | "goals" | "assists" | "name";

const DEFAULT_VISIBLE_POOL_COUNT = 24;

function App() {
  const [dataset, setDataset] = useState<PlayerDataset | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<GameStatus>("intro");
  const [lineup, setLineup] = useState<LineupAssignment>({ ...EMPTY_LINEUP });
  const [coachId, setCoachId] = useState<string | null>(null);
  const [draftedPlayerIds, setDraftedPlayerIds] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<DraftPrompt | null>(null);
  const [lastPromptKey, setLastPromptKey] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [seasonGames, setSeasonGames] = useState<82 | 84>(82);
  const [rngState, setRngState] = useState<number>(
    hashString("puck-perfect-default"),
  );
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [hideTutorialInFuture, setHideTutorialInFuture] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerFilter, setPlayerFilter] =
    useState<PlayerPoolFilter>("ALL");
  const [playerSort, setPlayerSort] = useState<PlayerPoolSort>("bestFit");
  const [visiblePoolCount, setVisiblePoolCount] = useState(
    DEFAULT_VISIBLE_POOL_COUNT,
  );

  useEffect(() => {
    let active = true;

    loadPlayerDataset().then((loadedDataset) => {
      if (!active) {
        return;
      }
      setDataset(loadedDataset);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!dataset) {
      return;
    }

    const hidden = loadTutorialHidden();
    setHideTutorialInFuture(hidden);
    setShowTutorial(!hidden);

    const sharedHash = window.location.hash.replace(/^#/, "");
    if (sharedHash) {
      const sharedState =
        parseShareCode(sharedHash) ??
        parseShareCode(decodeURIComponent(sharedHash));
      if (sharedState) {
        const sharedResult = simulateSeason(
          sharedState.lineup,
          sharedState.coachId,
          dataset.players,
          dataset.coaches,
          sharedState.seasonGames,
        );
        const sharedDraftedIds = LINEUP_SLOTS.map(
          (slot) => sharedState.lineup[slot],
        ).filter((playerId): playerId is string => Boolean(playerId));
        setLineup(sharedState.lineup);
        setCoachId(sharedState.coachId);
        setDraftedPlayerIds(sharedDraftedIds);
        setSeasonGames(sharedState.seasonGames);
        setResult(sharedResult);
        setStatus("results");
        setIsHydrated(true);
        return;
      }
    }

    const savedGame = loadSavedGame();
    if (!savedGame) {
      setIsHydrated(true);
      return;
    }

    setStatus(savedGame.status);
    setLineup(savedGame.lineup);
    setCoachId(savedGame.coachId);
    setDraftedPlayerIds(savedGame.draftedPlayerIds);
    setCurrentPrompt(savedGame.currentPrompt);
    setLastPromptKey(savedGame.lastPromptKey);
    setSelectedPlayerId(savedGame.selectedPlayerId);
    setSeasonGames(savedGame.seasonGames);
    setRngState(savedGame.rngState);
    setResult(savedGame.result);
    setIsHydrated(true);
  }, [dataset]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const stateToSave: PersistedGameState = {
      version: CURRENT_GAME_STATE_VERSION,
      status,
      lineup,
      coachId,
      draftedPlayerIds,
      currentPrompt,
      lastPromptKey,
      selectedPlayerId,
      seasonGames,
      rngState,
      result,
    };

    saveGame(stateToSave);
  }, [
    coachId,
    currentPrompt,
    draftedPlayerIds,
    isHydrated,
    lastPromptKey,
    lineup,
    result,
    rngState,
    seasonGames,
    selectedPlayerId,
    status,
  ]);

  useEffect(() => {
    if (result) {
      window.location.hash = result.shareCode;
    } else if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, [result]);

  useEffect(() => {
    if (status !== "spinning" || !dataset) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const promptResult = buildDraftPrompt(
        dataset.players,
        dataset.coaches,
        dataset.franchises,
        lineup,
        coachId,
        draftedPlayerIds,
        rngState,
        lastPromptKey,
      );
      setRngState(promptResult.rngState);
      setCurrentPrompt(promptResult.prompt);
      setLastPromptKey(getPromptKey(promptResult.prompt));
      setStatus(promptResult.prompt ? "choosingPlayer" : "ready");
    }, 1300);

    return () => window.clearTimeout(timeout);
  }, [
    coachId,
    dataset,
    draftedPlayerIds,
    lastPromptKey,
    lineup,
    rngState,
    status,
  ]);

  useEffect(() => {
    if (status !== "complete" || !dataset) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const nextResult = simulateSeason(
        lineup,
        coachId,
        dataset.players,
        dataset.coaches,
        seasonGames,
      );
      setResult(nextResult);
      setStatus("results");
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [coachId, dataset, lineup, seasonGames, status]);

  const fallbackDataset = getFallbackPlayerDataset();
  const activeDataset = dataset ?? fallbackDataset;
  const activePlayers = activeDataset.players;
  const activeCoaches = activeDataset.coaches;

  const selectedPlayer = useMemo(
    () =>
      currentPrompt?.kind === "player"
        ? getPlayerById(activePlayers, selectedPlayerId)
        : null,
    [activePlayers, currentPrompt?.kind, selectedPlayerId],
  );

  const selectedCoach = useMemo(
    () =>
      currentPrompt?.kind === "coach"
        ? getCoachById(activeCoaches, selectedPlayerId)
        : null,
    [activeCoaches, currentPrompt?.kind, selectedPlayerId],
  );

  const promptPlayers = useMemo(
    () =>
      currentPrompt?.kind === "player"
        ? currentPrompt.candidateIds
            .map((playerId) => getPlayerById(activePlayers, playerId))
            .filter((player): player is Player => Boolean(player))
        : [],
    [activePlayers, currentPrompt],
  );

  const promptCoaches = useMemo(
    () =>
      currentPrompt?.kind === "coach"
        ? currentPrompt.candidateIds
            .map((candidateId) => getCoachById(activeCoaches, candidateId))
            .filter((coach): coach is Coach => Boolean(coach))
        : [],
    [activeCoaches, currentPrompt],
  );

  const playerRatings = useMemo(() => {
    const ratings: Partial<Record<keyof LineupAssignment, number>> = {};

    LINEUP_SLOTS.forEach((slot) => {
      const player = getPlayerById(activePlayers, lineup[slot]);
      if (!player) {
        return;
      }
      ratings[slot] = calculatePlayerRating(player, slot).rating;
    });

    return ratings;
  }, [activePlayers, lineup]);

  const coachOverall = useMemo(() => {
    const coach = getCoachById(activeCoaches, coachId);
    return coach ? calculateCoachRating(coach).rating : undefined;
  }, [activeCoaches, coachId]);

  const shareUrl = useMemo(() => {
    const location = window.location;
    return `${location.origin}${location.pathname}#${result?.shareCode ?? ""}`;
  }, [result]);

  const selectedPlayerEligibleSlots =
    currentPrompt?.kind === "player" && selectedPlayer
      ? getEligibleLineupSlots(selectedPlayer, lineup)
      : [];
  const hasCompleteRoster = isRosterComplete(lineup, coachId);

  const openSlotPositions = useMemo(
    () =>
      new Set(
        LINEUP_SLOTS.filter((slot) => !lineup[slot]).map(
          (slot) => (slot.startsWith("D") ? "D" : slot) as PlayerPosition,
        ),
      ),
    [lineup],
  );

  const filteredPoolPlayers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();
    const basePlayers = promptPlayers.filter((player) => {
      const matchesQuery =
        !query ||
        [player.name, player.roleTag, ...player.teams.map((team) => team.teamName)]
          .some((value) => value.toLowerCase().includes(query));

      const matchesFilter = (() => {
        switch (playerFilter) {
          case "F":
            return player.primaryPosition !== "D" && player.primaryPosition !== "G";
          case "D":
            return player.primaryPosition === "D";
          case "G":
            return player.primaryPosition === "G";
          case "OPEN":
            return player.eligiblePositions.some((position) =>
              openSlotPositions.has(position),
            );
          default:
            return true;
        }
      })();

      return matchesQuery && matchesFilter;
    });

    const getPreviewOverall = (player: Player) => {
      const previewSlot = getEligibleLineupSlots(player, lineup)[0];
      return previewSlot
        ? calculatePlayerRating(player, previewSlot).rating
        : calculatePlayerRating(
            player,
            player.primaryPosition === "D"
              ? "D1"
              : (player.primaryPosition as "LW" | "C" | "RW" | "G"),
          ).rating;
    };

    return [...basePlayers].sort((left, right) => {
      switch (playerSort) {
        case "name":
          return left.name.localeCompare(right.name);
        case "goals":
          return (right.stats.goals ?? 0) - (left.stats.goals ?? 0);
        case "assists":
          return (right.stats.assists ?? 0) - (left.stats.assists ?? 0);
        case "points":
          return (
            (right.stats.points ?? right.stats.goalieWins ?? 0) -
            (left.stats.points ?? left.stats.goalieWins ?? 0)
          );
        case "bestFit":
        default:
          return getPreviewOverall(right) - getPreviewOverall(left);
      }
    });
  }, [
    lineup,
    openSlotPositions,
    playerFilter,
    playerSearch,
    playerSort,
    promptPlayers,
  ]);

  useEffect(() => {
    setVisiblePoolCount(DEFAULT_VISIBLE_POOL_COUNT);
  }, [currentPrompt, playerFilter, playerSearch, playerSort]);

  const visiblePoolPlayers = useMemo(
    () => filteredPoolPlayers.slice(0, visiblePoolCount),
    [filteredPoolPlayers, visiblePoolCount],
  );

  const openSlotSummary = useMemo(
    () => LINEUP_SLOTS.filter((slot) => !lineup[slot]).join(" • "),
    [lineup],
  );

  const draftedEntityCount = draftedPlayerIds.length + (coachId ? 1 : 0);

  const beginSpin = () => {
    if (
      currentPrompt ||
      status === "assigningSlot" ||
      status === "spinning" ||
      status === "complete" ||
      hasCompleteRoster
    ) {
      return;
    }

    setCurrentPrompt(null);
    setSelectedPlayerId(null);
    setPlayerSearch("");
    setPlayerFilter("ALL");
    setPlayerSort("bestFit");
    setStatus("spinning");
  };

  const handleStartDraft = () => {
    if (status === "intro") {
      setStatus("ready");
    }
    beginSpin();
  };

  const handleStartWithSeason = (games?: 82 | 84) => {
    if (games) {
      setSeasonGames(games);
    }
    handleStartDraft();
  };

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedPlayerId((currentSelectedId) => {
      const nextSelectedId =
        currentPrompt?.kind === "player" && currentSelectedId === candidateId
          ? null
          : candidateId;
      setStatus(nextSelectedId ? "assigningSlot" : currentPrompt ? "choosingPlayer" : "ready");
      return nextSelectedId;
    });
  };

  const handleCancelSelection = () => {
    setSelectedPlayerId(null);
    setStatus(currentPrompt ? "choosingPlayer" : "ready");
  };

  const handleConfirmSelection = () => {
    if (!selectedPlayerId || !currentPrompt) {
      return;
    }

    if (currentPrompt.kind === "coach") {
      setCoachId(selectedPlayerId);
      setSelectedPlayerId(null);
      setCurrentPrompt(null);
      setResult(null);
      setStatus("complete");
      return;
    }
  };

  const handleAssignSelectedPlayerToSlot = (slot: keyof LineupAssignment) => {
    if (!selectedPlayerId || !selectedPlayer) {
      return;
    }

    if (!selectedPlayerEligibleSlots.includes(slot)) {
      return;
    }

    const nextLineup = assignPlayerToSlot(
      lineup,
      slot,
      selectedPlayerId,
    );
    const nextDrafted = [...draftedPlayerIds, selectedPlayerId];

    setLineup(nextLineup);
    setDraftedPlayerIds(nextDrafted);
    setSelectedPlayerId(null);
    setCurrentPrompt(null);
    setResult(null);

    setStatus("ready");
  };

  const handleSeasonToggle = (value: 82 | 84) => {
    setSeasonGames(value);
    if (result && hasCompleteRoster && dataset) {
      setResult(
        simulateSeason(lineup, coachId, dataset.players, dataset.coaches, value),
      );
      setStatus("results");
    }
  };

  const handleNewDraft = () => {
    const freshSeed = hashString(`${Date.now()}`);
    setStatus("intro");
    setLineup(createInitialLineup());
    setCoachId(null);
    setDraftedPlayerIds([]);
    setCurrentPrompt(null);
    setLastPromptKey(null);
    setSelectedPlayerId(null);
    setPlayerSearch("");
    setPlayerFilter("ALL");
    setPlayerSort("bestFit");
    setRngState(freshSeed);
    setResult(null);
    clearSavedGame();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    saveTutorialHidden(hideTutorialInFuture);
  };

  if (!dataset) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 font-body sm:px-6 lg:px-8">
        <div className="space-y-6">
          <Header
            seasonGames={seasonGames}
            isSampleDataset={activeDataset.isSample}
            status={status}
            draftedCount={draftedEntityCount}
          />
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow">
            <p className="text-xs uppercase tracking-[0.3em] text-ice/70">
              Loading Player Pool
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase tracking-[0.12em] text-white">
              Warming up the historical boards
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
              Puck Perfect is loading the best available NHL dataset for this
              build. If no generated import is present, it will fall back to the
              bundled sample roster automatically.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto min-h-screen max-w-7xl px-4 py-6 font-body sm:px-6 lg:px-8 ${
        selectedPlayer || selectedCoach ? "pb-36 md:pb-6" : ""
      }`}
    >
      <HowToPlayModal
        isOpen={showTutorial}
        onClose={closeTutorial}
        hideInFuture={hideTutorialInFuture}
        onPreferenceChange={(value) => {
          setHideTutorialInFuture(value);
          saveTutorialHidden(value);
        }}
      />
      <PrivacyPolicyModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />

      <div className="space-y-6">
        <Header
          seasonGames={seasonGames}
          isSampleDataset={activeDataset.isSample}
          status={status}
          draftedCount={draftedEntityCount}
        />

        <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SeasonLengthToggle value={seasonGames} onChange={handleSeasonToggle} />
          <div className="flex flex-wrap gap-3">
            {status === "intro" || status === "results" ? (
              <button
                type="button"
                onClick={handleNewDraft}
                className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
              >
                New Draft
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
            >
              How To Play
            </button>
          </div>
        </div>

        {status === "intro" ? (
          <IntroPanel
            seasonGames={seasonGames}
            onStart={handleStartWithSeason}
            onOpenHowToPlay={() => setShowTutorial(true)}
          />
        ) : null}

        {status !== "intro" && status !== "results" ? (
          <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="order-2 space-y-6 xl:order-1">
              <DraftSpinner
                status={status}
                prompt={currentPrompt}
                onSpin={beginSpin}
                canSpin={!hasCompleteRoster && !currentPrompt && status === "ready"}
                spinFranchiseNames={[
                  ...new Set(
                    activeDataset.franchises.map((franchise) => franchise.displayName),
                  ),
                ]}
                spinEras={[
                  ...new Set(
                    activePlayers.flatMap((player) =>
                      player.teams.flatMap((team) => team.decadeTags),
                    ),
                  ),
                ]}
              />

              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ice/70">
                      {currentPrompt?.kind === "coach" ? "Coach Board" : "Player Board"}
                    </p>
                    <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.12em] text-white">
                      {status === "assigningSlot"
                        ? currentPrompt?.kind === "coach"
                          ? "Confirm your coach"
                          : "Choose a lineup slot"
                        : currentPrompt?.kind === "coach"
                          ? "Eligible coaches"
                          : currentPrompt
                            ? "Eligible players"
                            : "Spin to reveal candidates"}
                    </h2>
                  </div>
                  {activeDataset.isSample ? (
                    <div className="rounded-full border border-ember/20 bg-ember/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ember">
                      Sample dataset
                    </div>
                  ) : null}
                </div>

                {promptPlayers.length ? (
                  <div className="mt-5 space-y-4">
                    {selectedPlayer ? (
                      <div className="rounded-[1.4rem] border border-ember/25 bg-ember/10 p-4">
                        <div className="text-xs uppercase tracking-[0.24em] text-ember">
                          Position selection
                        </div>
                        <div className="mt-2 font-display text-2xl uppercase tracking-[0.08em] text-white">
                          {selectedPlayer.name}
                        </div>
                        <div className="mt-2 text-sm text-slate-200">
                          Tap one of the highlighted open slots on the rink to place this player. Natural fits still score best.
                        </div>
                        <div className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-300">
                          Eligible slots: {selectedPlayerEligibleSlots.join(" • ")}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleCancelSelection}
                            className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/[0.1]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/35 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-xs uppercase tracking-[0.26em] text-slate-400">
                          Eligible for your open slots
                        </div>
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                          Showing{" "}
                          {Math.min(
                            visiblePoolPlayers.length,
                            filteredPoolPlayers.length,
                          )}{" "}
                          of {filteredPoolPlayers.length}
                          {filteredPoolPlayers.length !== promptPlayers.length
                            ? ` filtered from ${promptPlayers.length}`
                            : ""}
                        </div>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-3 text-[0.68rem] uppercase tracking-[0.22em] text-slate-400">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                          Open slots: {openSlotSummary}
                        </span>
                        <span className="rounded-full border border-ice/20 bg-ice/10 px-3 py-2 text-ice">
                          Heuristic forward flexibility is enabled
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 xl:flex-row">
                        <input
                          type="search"
                          value={playerSearch}
                          onChange={(event) => setPlayerSearch(event.target.value)}
                          placeholder="Search players or teams"
                          aria-label="Search current player pool"
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#121b2f] px-4 py-3 text-sm text-white placeholder:text-slate-500"
                        />

                        <div className="flex flex-wrap gap-2">
                          {([
                            ["ALL", "All"],
                            ["F", "Forwards"],
                            ["D", "Defense"],
                            ["G", "Goalies"],
                            ["OPEN", "Fits Open"],
                          ] as const).map(([value, label]) => {
                            const active = playerFilter === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setPlayerFilter(value)}
                                className={`rounded-full px-4 py-3 text-xs uppercase tracking-[0.2em] transition ${
                                  active
                                    ? "bg-ember text-ink"
                                    : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.09]"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        <select
                          value={playerSort}
                          onChange={(event) =>
                            setPlayerSort(event.target.value as PlayerPoolSort)
                          }
                          aria-label="Sort player pool"
                          className="rounded-xl border border-white/10 bg-[#121b2f] px-4 py-3 text-sm text-white"
                        >
                          <option value="bestFit">Sort: Best Fit</option>
                          <option value="points">Sort: Points</option>
                          <option value="goals">Sort: Goals</option>
                          <option value="assists">Sort: Assists</option>
                          <option value="name">Sort: Name</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {visiblePoolPlayers.map((player) => {
                        const previewSlot = getEligibleLineupSlots(player, lineup)[0];
                        const overall = previewSlot
                          ? calculatePlayerRating(player, previewSlot).rating
                          : calculatePlayerRating(
                              player,
                              player.primaryPosition === "D"
                                ? "D1"
                                : (player.primaryPosition as "LW" | "C" | "RW" | "G"),
                            ).rating;

                        return (
                          <PlayerCard
                            key={player.id}
                            player={player}
                            overall={overall}
                            franchiseId={currentPrompt?.franchiseId}
                            selected={selectedPlayerId === player.id}
                            muted={Boolean(selectedPlayerId && selectedPlayerId !== player.id)}
                            actionLabel={
                              selectedPlayerId === player.id
                                ? "Clear Selection"
                                : "Choose Player"
                            }
                            onAction={() =>
                              selectedPlayerId === player.id
                                ? handleCancelSelection()
                                : handleSelectCandidate(player.id)
                            }
                            layout="row"
                          />
                        );
                      })}
                    </div>

                    {filteredPoolPlayers.length > visiblePoolPlayers.length ? (
                      <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1.4rem] border border-white/10 bg-slate-950/30 px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          Deep pool detected
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setVisiblePoolCount((count) =>
                              Math.min(
                                count + DEFAULT_VISIBLE_POOL_COUNT,
                                filteredPoolPlayers.length,
                              ),
                            )
                          }
                          className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.12]"
                        >
                          Show 24 More
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisiblePoolCount(filteredPoolPlayers.length)}
                          className="rounded-full border border-ice/20 bg-ice/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ice transition hover:bg-ice hover:text-ink"
                        >
                          Show All {filteredPoolPlayers.length}
                        </button>
                      </div>
                    ) : filteredPoolPlayers.length > DEFAULT_VISIBLE_POOL_COUNT ? (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisiblePoolCount(DEFAULT_VISIBLE_POOL_COUNT)}
                          className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white/[0.1]"
                        >
                          Show Fewer
                        </button>
                      </div>
                    ) : null}

                    {!filteredPoolPlayers.length ? (
                      <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-slate-950/30 px-5 py-6 text-center text-sm text-slate-300">
                        No players matched the current search and filter settings.
                      </div>
                    ) : null}
                  </div>
                ) : promptCoaches.length ? (
                  <div className="mt-5 space-y-4">
                    {selectedCoach ? (
                      <div className="rounded-[1.4rem] border border-aurora/25 bg-aurora/10 p-4">
                        <div className="text-xs uppercase tracking-[0.24em] text-aurora">
                          Confirm head coach
                        </div>
                        <div className="mt-2 font-display text-2xl uppercase tracking-[0.08em] text-white">
                          {selectedCoach.name}
                        </div>
                        <div className="mt-2 text-sm text-slate-200">
                          This coach adds a small but meaningful season-long edge.
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleConfirmSelection}
                            className="rounded-full border border-aurora/40 bg-aurora px-4 py-3 text-sm uppercase tracking-[0.18em] text-ink transition hover:brightness-110"
                          >
                            Confirm Coach
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelSelection}
                            className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/[0.1]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/35 p-4">
                      <div className="text-xs uppercase tracking-[0.26em] text-slate-400">
                        Bench boss round
                      </div>
                      <div className="mt-2 text-sm text-slate-200">
                        Career wins lead the coach grade, with win percentage and Stanley Cups adding support.
                      </div>
                    </div>

                    <div className="space-y-3">
                      {promptCoaches.map((coach) => (
                        <CoachCard
                          key={coach.id}
                          coach={coach}
                          overall={calculateCoachRating(coach).rating}
                          franchiseId={currentPrompt?.franchiseId}
                          selected={selectedPlayerId === coach.id}
                          muted={Boolean(selectedPlayerId && selectedPlayerId !== coach.id)}
                          actionLabel={
                            selectedPlayerId === coach.id
                              ? "Confirm Coach"
                              : "Hire Coach"
                          }
                          onAction={() =>
                            selectedPlayerId === coach.id
                              ? handleConfirmSelection()
                              : handleSelectCandidate(coach.id)
                          }
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm leading-6 text-slate-300">
                    {status === "complete"
                      ? "Roster locked. Running the season simulation now."
                      : "No active pool yet. Spin the board to pull in a valid franchise-era group."}
                  </div>
                )}
              </section>
            </div>

            <div className="order-1 xl:order-2">
              <LineupBoard
                lineup={lineup}
                players={activePlayers}
                selectedPlayer={selectedPlayer}
                pendingSlots={selectedPlayerEligibleSlots}
                playerRatings={playerRatings}
                coach={getCoachById(activeCoaches, coachId)}
                coachOverall={coachOverall}
                coachPending={Boolean(currentPrompt?.kind === "coach")}
                onSlotSelect={handleAssignSelectedPlayerToSlot}
              />
            </div>
          </div>
        ) : null}

        {status === "results" && result ? (
          <ResultPanel
            result={result}
            lineup={lineup}
            players={activePlayers}
            coaches={activeCoaches}
            coachId={coachId}
            shareUrl={shareUrl}
            onNewDraft={handleNewDraft}
          />
        ) : null}
      </div>

      <SiteFooter
        onOpenHowToPlay={() => setShowTutorial(true)}
        onOpenPrivacyPolicy={() => setShowPrivacyPolicy(true)}
      />

      {selectedPlayer ? (
        <div className="fixed inset-x-3 bottom-3 z-40 rounded-[1.5rem] border border-ember/25 bg-[#10182b]/95 p-4 shadow-glow backdrop-blur md:hidden">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.24em] text-ember">
              Choose Position
            </div>
            <div className="mt-2 font-display text-2xl uppercase tracking-[0.06em] text-white">
              {selectedPlayer.name}
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-300">
              Tap a highlighted slot on the rink: {selectedPlayerEligibleSlots.join(" • ")}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={handleCancelSelection}
              className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-3 text-sm uppercase tracking-[0.18em] text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {selectedCoach ? (
        <div className="fixed inset-x-3 bottom-3 z-40 rounded-[1.5rem] border border-aurora/25 bg-[#10182b]/95 p-4 shadow-glow backdrop-blur md:hidden">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.24em] text-aurora">
              Confirm Coach
            </div>
            <div className="mt-2 font-display text-2xl uppercase tracking-[0.06em] text-white">
              {selectedCoach.name}
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-300">
              Bench boost: {calculateCoachRating(selectedCoach).rating}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={handleConfirmSelection}
              className="rounded-full border border-aurora/35 bg-aurora px-4 py-3 text-sm uppercase tracking-[0.18em] text-ink"
            >
              Confirm Coach
            </button>
            <button
              type="button"
              onClick={handleCancelSelection}
              className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-3 text-sm uppercase tracking-[0.18em] text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
