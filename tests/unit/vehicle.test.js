import { describe, expect, it } from "vitest";
import {
  computeEngineForce,
  computeSteerAngle,
  applyDamage,
} from "../../src/vehicle/vehicle.js";
import { ARCHETYPES } from "../../src/config/tuning.js";

describe("computeEngineForce", () => {
  it("scales with the archetype's engineForce", () => {
    const heavyForce = computeEngineForce(ARCHETYPES.heavy, 1, 1);
    const lightForce = computeEngineForce(ARCHETYPES.light, 1, 1);
    expect(heavyForce).not.toBeCloseTo(lightForce);
    expect(heavyForce).toBeCloseTo(ARCHETYPES.heavy.engineForce);
    expect(lightForce).toBeCloseTo(ARCHETYPES.light.engineForce);
  });

  it("is zero with no throttle input", () => {
    expect(computeEngineForce(ARCHETYPES.balanced, 0, 1)).toBe(0);
  });

  it("applies the turbo multiplier", () => {
    const base = computeEngineForce(ARCHETYPES.balanced, 1, 1);
    const boosted = computeEngineForce(
      ARCHETYPES.balanced,
      1,
      ARCHETYPES.balanced.turboBoostMultiplier,
    );
    expect(boosted).toBeGreaterThan(base);
  });
});

describe("computeSteerAngle", () => {
  it("differs between archetypes for the same input (turn-rate differentiation)", () => {
    const heavySteer = Math.abs(computeSteerAngle(ARCHETYPES.heavy, 1));
    const lightSteer = Math.abs(computeSteerAngle(ARCHETYPES.light, 1));
    expect(lightSteer).toBeGreaterThan(heavySteer);
  });

  it("is zero with no steer input", () => {
    expect(computeSteerAngle(ARCHETYPES.balanced, 0)).toBeCloseTo(0);
  });
});

describe("archetype stat distinctness (FR-005)", () => {
  it("gives each archetype a distinct mass, hp, and max speed", () => {
    const ids = ["heavy", "light", "balanced"];
    const masses = new Set(ids.map((id) => ARCHETYPES[id].mass));
    const hps = new Set(ids.map((id) => ARCHETYPES[id].maxHp));
    const speeds = new Set(ids.map((id) => ARCHETYPES[id].maxSpeed));
    expect(masses.size).toBe(3);
    expect(hps.size).toBe(3);
    expect(speeds.size).toBe(3);
  });

  it("heavy is the slowest and lightest-handling; light is the fastest and most agile", () => {
    expect(ARCHETYPES.heavy.maxSpeed).toBeLessThan(ARCHETYPES.balanced.maxSpeed);
    expect(ARCHETYPES.balanced.maxSpeed).toBeLessThan(ARCHETYPES.light.maxSpeed);
    expect(ARCHETYPES.heavy.mass).toBeGreaterThan(ARCHETYPES.balanced.mass);
    expect(ARCHETYPES.balanced.mass).toBeGreaterThan(ARCHETYPES.light.mass);
  });
});

describe("applyDamage", () => {
  function makeVehicle(hp) {
    return { hp, eliminated: false };
  }

  it("reduces hp by the given amount", () => {
    const vehicle = makeVehicle(100);
    applyDamage(vehicle, 30);
    expect(vehicle.hp).toBe(70);
  });

  it("clamps hp at zero and marks eliminated", () => {
    const vehicle = makeVehicle(20);
    applyDamage(vehicle, 50);
    expect(vehicle.hp).toBe(0);
    expect(vehicle.eliminated).toBe(true);
  });

  it("does nothing further once eliminated", () => {
    const vehicle = { hp: 0, eliminated: true };
    applyDamage(vehicle, 10);
    expect(vehicle.hp).toBe(0);
  });
});
