import { describe, expect, it } from "vitest";
import { createTurboState, updateTurboState } from "../../src/vehicle/turbo.js";

const DURATIONS = { turboBoostDuration: 2, turboCooldown: 4 };

describe("TurboState", () => {
  it("starts fully charged and not boosting", () => {
    const turbo = createTurboState();
    expect(turbo.charge).toBe(1);
    expect(turbo.boosting).toBe(false);
  });

  it("boosts while held and charge remains", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1, DURATIONS);
    expect(turbo.boosting).toBe(true);
    expect(turbo.charge).toBeCloseTo(0.95);
  });

  it("drains charge at 1 / turboBoostDuration per second while boosting", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 1, DURATIONS); // 1s of a 2s-to-drain meter
    expect(turbo.charge).toBeCloseTo(0.5);
  });

  it("stops boosting the instant the button is released", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 1, DURATIONS);
    updateTurboState(turbo, false, 0.01, DURATIONS);
    expect(turbo.boosting).toBe(false);
  });

  it("starts recharging immediately on release, not after a separate cooldown", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 1, DURATIONS); // charge -> 0.5
    updateTurboState(turbo, false, 1, DURATIONS); // 1s of a 4s-to-refill meter
    expect(turbo.boosting).toBe(false);
    expect(turbo.charge).toBeCloseTo(0.75);
  });

  it("stops boosting once charge is fully drained, even while still held", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, DURATIONS.turboBoostDuration, DURATIONS); // drains to 0
    expect(turbo.charge).toBe(0);
    updateTurboState(turbo, true, 0.1, DURATIONS); // still held, but empty
    expect(turbo.boosting).toBe(false);
  });

  it("does not recharge while still held, even once charge is empty (no drain/recharge flicker)", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, DURATIONS.turboBoostDuration, DURATIONS); // drains to 0
    updateTurboState(turbo, true, 1, DURATIONS); // still held, empty
    expect(turbo.boosting).toBe(false);
    expect(turbo.charge).toBe(0);
  });

  it("only starts recharging once the button is actually released", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, DURATIONS.turboBoostDuration, DURATIONS); // drains to 0
    updateTurboState(turbo, true, 5, DURATIONS); // still held, empty, no recharge
    expect(turbo.charge).toBe(0);
    updateTurboState(turbo, false, 1, DURATIONS); // released -> recharges
    expect(turbo.charge).toBeCloseTo(0.25);
  });

  it("can resume boosting immediately with partial charge, no full-recharge gate", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 1, DURATIONS); // charge -> 0.5
    updateTurboState(turbo, false, 0.5, DURATIONS); // charge -> 0.625, not full
    updateTurboState(turbo, true, 0.01, DURATIONS);
    expect(turbo.boosting).toBe(true);
  });

  it("never drains charge below zero or refills above one", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 100, DURATIONS);
    expect(turbo.charge).toBe(0);
    updateTurboState(turbo, false, 100, DURATIONS);
    expect(turbo.charge).toBe(1);
  });
});
