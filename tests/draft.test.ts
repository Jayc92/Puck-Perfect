import { describe, expect, it } from "vitest";
import { sampleCoaches } from "../src/data/sampleCoaches";
import { sampleFranchises } from "../src/data/sampleFranchises";
import { samplePlayers } from "../src/data/samplePlayers";
import { buildDraftPrompt, createInitialLineup, parseShareCode } from "../src/lib/draft";
import { buildShareCode } from "../src/lib/simulation";

describe("draft prompt generation", () => {
  it("starts the draft with a valid coach pool", () => {
    const first = buildDraftPrompt(
      samplePlayers,
      sampleCoaches,
      sampleFranchises,
      createInitialLineup(),
      null,
      [],
      123456,
    );

    expect(first.prompt).not.toBeNull();
    expect(first.prompt?.kind).toBe("coach");
    expect(first.prompt?.candidateIds.length).toBeGreaterThanOrEqual(2);
    expect(new Set(first.prompt?.candidateIds).size).toBe(first.prompt?.candidateIds.length);

    const coaches = first.prompt?.candidateIds.map((coachId) =>
      sampleCoaches.find((coach) => coach.id === coachId),
    );
    expect(coaches.every(Boolean)).toBe(true);
    expect(
      coaches.every((coach) =>
        coach?.teams.some(
          (team) =>
            team.franchiseId === first.prompt?.franchiseId &&
            team.decadeTags.includes(first.prompt?.decadeTag ?? ""),
        ),
      ),
    ).toBe(true);
  });

  it("switches to a player pool after a coach is selected", () => {
    const first = buildDraftPrompt(
      samplePlayers,
      sampleCoaches,
      sampleFranchises,
      createInitialLineup(),
      null,
      [],
      123456,
    );

    const selectedCoachId = first.prompt?.candidateIds[0] ?? null;

    const second = buildDraftPrompt(
      samplePlayers,
      sampleCoaches,
      sampleFranchises,
      createInitialLineup(),
      selectedCoachId,
      [],
      first.rngState,
      `${first.prompt?.franchiseId}:${first.prompt?.decadeTag}`,
    );

    expect(second.prompt).not.toBeNull();
    expect(second.prompt?.kind).toBe("player");
    expect(second.prompt?.candidateIds.length).toBeGreaterThanOrEqual(3);
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

    const shareCode = buildShareCode(lineup, "scotty-bowman", 84);
    const parsed = parseShareCode(shareCode);

    expect(parsed).toEqual({
      seasonGames: 84,
      lineup,
      coachId: "scotty-bowman",
    });
  });

  it("avoids repeating the same franchise-era prompt in back-to-back rounds when alternatives exist", () => {
    const first = buildDraftPrompt(
      samplePlayers,
      sampleCoaches,
      sampleFranchises,
      createInitialLineup(),
      null,
      [],
      123456,
    );

    expect(first.prompt).not.toBeNull();

    const second = buildDraftPrompt(
      samplePlayers,
      sampleCoaches,
      sampleFranchises,
      createInitialLineup(),
      first.prompt?.candidateIds[0] ?? null,
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
