import { describe, expect, it } from "vitest";
import { samplePlayers } from "../src/data/samplePlayers";
import { simulateSeason } from "../src/lib/simulation";

describe("season simulation", () => {
  it("is deterministic for the same lineup and season length", () => {
    const lineup = {
      LW: "steve-shutt",
      C: "wayne-gretzky",
      RW: "jaromir-jagr",
      D1: "nicklas-lidstrom",
      D2: "larry-robinson",
      G: "patrick-roy",
    } as const;

    const first = simulateSeason(lineup, samplePlayers, 82);
    const second = simulateSeason(lineup, samplePlayers, 82);

    expect(second).toEqual(first);
  });

  it("changes output when season length changes", () => {
    const lineup = {
      LW: "steve-shutt",
      C: "wayne-gretzky",
      RW: "jaromir-jagr",
      D1: "nicklas-lidstrom",
      D2: "larry-robinson",
      G: "patrick-roy",
    } as const;

    const eightyTwo = simulateSeason(lineup, samplePlayers, 82);
    const eightyFour = simulateSeason(lineup, samplePlayers, 84);

    expect(eightyTwo.seasonGames).toBe(82);
    expect(eightyFour.seasonGames).toBe(84);
    expect(eightyTwo.shareCode).not.toBe(eightyFour.shareCode);
  });
});
