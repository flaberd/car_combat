import { describe, expect, it } from "vitest";
import { computeRamDamage, handleRammingCollision } from "../../src/combat/ramming.js";
import { registerVehicle, unregisterVehicle } from "../../src/combat/registry.js";

function fakeVehicle(handle, { mass, hp, approachSpeed }) {
  return {
    chassisCollider: { handle },
    archetype: { mass },
    hp,
    eliminated: false,
    approachSpeed,
    ramCooldownRemaining: 0,
  };
}

describe("computeRamDamage", () => {
  it("computes damage = (speed - minImpactSpeed) * mass * k", () => {
    expect(computeRamDamage(10, 1000, 0.01, 3)).toBeCloseTo((10 - 3) * 1000 * 0.01);
  });

  it("scales with speed", () => {
    const lower = computeRamDamage(10, 1000, 0.01, 3);
    const higher = computeRamDamage(20, 1000, 0.01, 3);
    expect(higher).toBeGreaterThan(lower);
  });

  it("scales with mass — a heavier vehicle deals more damage at the same speed", () => {
    const lightDamage = computeRamDamage(10, 700, 0.01, 3);
    const heavyDamage = computeRamDamage(10, 1500, 0.01, 3);
    expect(heavyDamage).toBeGreaterThan(lightDamage);
  });

  it("is zero at or below the minimum-impact speed threshold", () => {
    expect(computeRamDamage(3, 1000, 0.01, 3)).toBe(0);
    expect(computeRamDamage(1, 1000, 0.01, 3)).toBe(0);
    expect(computeRamDamage(0, 1000, 0.01, 3)).toBe(0);
  });

  it("does not go negative for speeds below the threshold", () => {
    expect(computeRamDamage(0.5, 1000, 0.01, 3)).toBe(0);
  });

  it("uses the magnitude of speed regardless of sign", () => {
    expect(computeRamDamage(-10, 1000, 0.01, 3)).toBeCloseTo(
      computeRamDamage(10, 1000, 0.01, 3),
    );
  });

  it("defaults k and minImpactSpeed from RAM tuning when not provided", () => {
    // RAM.k is 0.004 and RAM.minImpactSpeed is 3 per src/config/tuning.js.
    expect(computeRamDamage(10, 1000)).toBeCloseTo((10 - 3) * 1000 * 0.004);
  });
});

describe("handleRammingCollision", () => {
  it("applies damage from each vehicle's approachSpeed snapshot, not live velocity", () => {
    const a = fakeVehicle(1, { mass: 1000, hp: 100, approachSpeed: 10 });
    const b = fakeVehicle(2, { mass: 1000, hp: 100, approachSpeed: 5 });
    registerVehicle(a);
    registerVehicle(b);

    handleRammingCollision(1, 2, true);

    expect(b.hp).toBeCloseTo(100 - (10 - 3) * 1000 * 0.004); // damaged by A's approach speed
    expect(a.hp).toBeCloseTo(100 - (5 - 3) * 1000 * 0.004); // damaged by B's approach speed

    unregisterVehicle(a);
    unregisterVehicle(b);
  });

  it("does not re-apply damage to a vehicle whose ramCooldownRemaining hasn't elapsed", () => {
    const a = fakeVehicle(3, { mass: 1000, hp: 100, approachSpeed: 10 });
    const b = fakeVehicle(4, { mass: 1000, hp: 100, approachSpeed: 10 });
    registerVehicle(a);
    registerVehicle(b);

    handleRammingCollision(3, 4, true);
    const hpAfterFirstHit = b.hp;

    // Simulate Rapier re-firing `started` for the same sustained contact
    // a few physics steps later, before the cooldown has expired.
    handleRammingCollision(3, 4, true);

    expect(b.hp).toBe(hpAfterFirstHit);
    expect(a.hp).toBe(hpAfterFirstHit);

    unregisterVehicle(a);
    unregisterVehicle(b);
  });

  it("ignores collision-end events", () => {
    const a = fakeVehicle(5, { mass: 1000, hp: 100, approachSpeed: 10 });
    const b = fakeVehicle(6, { mass: 1000, hp: 100, approachSpeed: 10 });
    registerVehicle(a);
    registerVehicle(b);

    handleRammingCollision(5, 6, false);

    expect(a.hp).toBe(100);
    expect(b.hp).toBe(100);

    unregisterVehicle(a);
    unregisterVehicle(b);
  });
});
