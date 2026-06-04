import { describe, expect, it } from "vitest";
import { sampleCoaches } from "../src/data/sampleCoaches";
import { calculatePlayerRating, calculateTeamRating } from "../src/lib/scoring";
import { samplePlayers } from "../src/data/samplePlayers";

const getPlayer = (id: string) => {
  const player = samplePlayers.find((entry) => entry.id === id);
  if (!player) {
    throw new Error(`Missing sample player: ${id}`);
  }
  return player;
};

describe("scoring", () => {
  it("penalizes out-of-position assignments", () => {
    const lidstrom = getPlayer("nicklas-lidstrom");

    const natural = calculatePlayerRating(lidstrom, "D1");
    const forcedWing = calculatePlayerRating(lidstrom, "LW");

    expect(natural.fitPenalty).toBe(0);
    expect(forcedWing.fitPenalty).toBeGreaterThan(natural.fitPenalty);
    expect(forcedWing.rating).toBeLessThan(natural.rating);
  });

  it("rewards balanced, natural-fit lineups", () => {
    const balancedLineup = {
      LW: "brendan-shanahan",
      C: "steve-yzerman",
      RW: "jari-kurri",
      D1: "nicklas-lidstrom",
      D2: "scott-stevens",
      G: "martin-brodeur",
    } as const;

    const awkwardLineup = {
      LW: "nicklas-lidstrom",
      C: "brendan-shanahan",
      RW: "steve-yzerman",
      D1: "jari-kurri",
      D2: "scott-stevens",
      G: "grant-fuhr",
    } as const;

    const balanced = calculateTeamRating(
      balancedLineup,
      samplePlayers,
      "scotty-bowman",
      sampleCoaches,
    );
    const awkward = calculateTeamRating(
      awkwardLineup,
      samplePlayers,
      "darryl-sutter",
      sampleCoaches,
    );

    expect(balanced.teamRating).toBeGreaterThan(awkward.teamRating);
    expect(balanced.fitScore).toBeGreaterThan(awkward.fitScore);
  });
});
