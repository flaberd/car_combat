import { describe, expect, it } from "vitest";
import { computeRamDamage } from "../../src/combat/ramming.js";

describe("computeRamDamage", () => {
  it("computes damage = speed * mass * k", () => {
    expect(computeRamDamage(10, 1000, 0.01)).toBeCloseTo(100);
  });

  it("scales with speed", () => {
    expect(computeRamDamage(20, 1000, 0.01)).toBeCloseTo(200);
  });

  it("scales with mass — a heavier vehicle deals more damage at the same speed", () => {
    const lightDamage = computeRamDamage(10, 700, 0.01);
    const heavyDamage = computeRamDamage(10, 1500, 0.01);
    expect(heavyDamage).toBeGreaterThan(lightDamage);
  });

  it("is zero at zero speed", () => {
    expect(computeRamDamage(0, 1000, 0.01)).toBe(0);
  });

  it("uses the magnitude of speed regardless of sign", () => {
    expect(computeRamDamage(-10, 1000, 0.01)).toBeCloseTo(
      computeRamDamage(10, 1000, 0.01),
    );
  });

  it("defaults k from RAM tuning when not provided", () => {
    // RAM.k is 0.01 per src/config/tuning.js — same result as passing it explicitly.
    expect(computeRamDamage(10, 1000)).toBeCloseTo(100);
  });
});
