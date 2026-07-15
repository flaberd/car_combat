import { describe, expect, it } from "vitest";
import { computeMineTimerTick } from "../../src/combat/mine.js";
import { WEAPONS } from "../../src/config/tuning.js";

describe("computeMineTimerTick", () => {
  it("counts down armDelayRemaining first, leaving lifetime untouched", () => {
    const state = {
      armDelayRemaining: WEAPONS.mines.armDelay,
      lifetimeRemaining: WEAPONS.mines.lifetime,
    };
    const next = computeMineTimerTick(state, 0.5);
    expect(next.armDelayRemaining).toBeCloseTo(WEAPONS.mines.armDelay - 0.5);
    expect(next.lifetimeRemaining).toBe(WEAPONS.mines.lifetime);
    expect(next.expired).toBe(false);
  });

  it("does not expire while still arming, even past its own tick", () => {
    const next = computeMineTimerTick(
      { armDelayRemaining: 0.1, lifetimeRemaining: 30 },
      0.5,
    );
    expect(next.expired).toBe(false);
  });

  it("switches to counting down lifetime once armed", () => {
    const next = computeMineTimerTick(
      { armDelayRemaining: 0, lifetimeRemaining: 30 },
      1,
    );
    expect(next.armDelayRemaining).toBe(0);
    expect(next.lifetimeRemaining).toBeCloseTo(29);
    expect(next.expired).toBe(false);
  });

  it("expires once lifetime reaches zero", () => {
    const next = computeMineTimerTick(
      { armDelayRemaining: 0, lifetimeRemaining: 0.3 },
      0.5,
    );
    expect(next.expired).toBe(true);
  });
});
