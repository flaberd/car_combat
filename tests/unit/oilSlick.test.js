import { describe, expect, it } from "vitest";
import { computeOilOccupancyChange } from "../../src/combat/oilSlick.js";

describe("computeOilOccupancyChange", () => {
  it("entering a segment from zero occupancy applies the effect", () => {
    const { count, inOil } = computeOilOccupancyChange(0, 1);
    expect(count).toBe(1);
    expect(inOil).toBe(true);
  });

  it("exiting the only occupied segment removes the effect", () => {
    const { count, inOil } = computeOilOccupancyChange(1, -1);
    expect(count).toBe(0);
    expect(inOil).toBe(false);
  });

  it("stays in effect while overlapping more than one segment", () => {
    const afterEnteringSecond = computeOilOccupancyChange(1, 1);
    expect(afterEnteringSecond.count).toBe(2);
    expect(afterEnteringSecond.inOil).toBe(true);

    const afterExitingOne = computeOilOccupancyChange(
      afterEnteringSecond.count,
      -1,
    );
    expect(afterExitingOne.count).toBe(1);
    expect(afterExitingOne.inOil).toBe(true); // still on the other segment
  });

  it("never goes negative (defensive against a stray extra exit event)", () => {
    const { count, inOil } = computeOilOccupancyChange(0, -1);
    expect(count).toBe(0);
    expect(inOil).toBe(false);
  });
});
