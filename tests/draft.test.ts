import { describe, expect, it } from "vitest";
import { sampleFranchises } from "../src/data/sampleFranchises";
import { samplePlayers } from "../src/data/samplePlayers";
import { buildDraftPrompt, createInitialLineup, parseShareCode } from "../src/lib/draft";
import { buildShareCode } from "../src/lib/simulation";

describe("draft prompt generation", () => {
  it("returns a valid prompt with a draftable player pool", () => {
    const result = buildDraftPrompt(
      samplePlayers,
      sampleFranchises,
      createInitialLineup(),
      [],
      123456,
    );

    expect(result.prompt).not.toBeNull();
    expect(result.prompt?.playerIds.length).toBeGreaterThanOrEqual(3);
    expect(new Set(result.prompt?.playerIds).size).toBe(result.prompt?.playerIds.length);

    const players = result.prompt?.playerIds.map((playerId) =>
      samplePlayers.find((player) => player.id === playerId),
    );
    expect(players.every(Boolean)).toBe(true);
    expect(
      players.every((player) =>
        player?.teams.some(
          (team) =>
            team.franchiseId === result.prompt?.franchiseId &&
            team.decadeTags.includes(result.prompt?.decadeTag ?? ""),
        ),
      ),
    ).toBe(true);
  });

  it("round-trips the share code into season length and lineup", () => {
    const lineup = {
      LW: "brendan-shanahan",
      C: "steve-yzerman",
      RW: "jari-kurri",
      D1: "nicklas-lidstrom",
      D2: "scott-stevens",
      G: "martin-brodeur",
    } as const;

    const shareCode = buildShareCode(lineup, 84);
    const parsed = parseShareCode(shareCode);

    expect(parsed).toEqual({
      seasonGames: 84,
      lineup,
    });
  });

  it("avoids repeating the same franchise-era prompt in back-to-back rounds when alternatives exist", () => {
    const first = buildDraftPrompt(
      samplePlayers,
      sampleFranchises,
      createInitialLineup(),
      [],
      123456,
    );

    expect(first.prompt).not.toBeNull();

    const second = buildDraftPrompt(
      samplePlayers,
      sampleFranchises,
      createInitialLineup(),
      [],
      first.rngState,
      `${first.prompt?.franchiseId}:${first.prompt?.decadeTag}`,
    );

    expect(second.prompt).not.toBeNull();
    expect(`${second.prompt?.franchiseId}:${second.prompt?.decadeTag}`).not.toBe(
      `${first.prompt?.franchiseId}:${first.prompt?.decadeTag}`,
    );
  });
});
