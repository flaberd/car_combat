import { describe, expect, it } from "vitest";
import { computeHomingVelocity } from "../../src/combat/projectile.js";

describe("computeHomingVelocity", () => {
  it("preserves speed magnitude while turning", () => {
    const { x, z } = computeHomingVelocity(0, 10, 10, 0, Math.PI / 4);
    expect(Math.hypot(x, z)).toBeCloseTo(10);
  });

  it("turns toward the target direction, clamped by maxTurnRadians", () => {
    // Moving along +z (0, speed), target is directly to the +x side (90 deg away).
    const maxTurn = 0.2; // radians this step
    const { x, z } = computeHomingVelocity(0, 10, 10, 0, maxTurn);
    const newAngle = Math.atan2(x, z);
    expect(newAngle).toBeCloseTo(maxTurn);
  });

  it("does not overshoot when the required turn is within maxTurnRadians", () => {
    // Small required turn (target nearly straight ahead with a slight x offset).
    const { x, z } = computeHomingVelocity(0, 10, 1, 10, Math.PI / 2);
    const newAngle = Math.atan2(x, z);
    const desiredAngle = Math.atan2(1, 10);
    expect(newAngle).toBeCloseTo(desiredAngle, 4);
  });

  it("returns velocity unchanged when target direction is degenerate (zero vector)", () => {
    const result = computeHomingVelocity(3, 4, 0, 0, 0.5);
    expect(result).toEqual({ x: 3, z: 4 });
  });

  it("returns velocity unchanged when current speed is ~zero", () => {
    const result = computeHomingVelocity(0, 0, 5, 5, 0.5);
    expect(result).toEqual({ x: 0, z: 0 });
  });

  it("a sharp enough target-direction change can still evade within one step (bounded turn)", () => {
    // Target suddenly behind (180 deg) — with a small turn rate, the rocket
    // can only partially correct, confirming it's dodgeable.
    const maxTurn = 0.1;
    const { x, z } = computeHomingVelocity(0, 10, 0, -10, maxTurn);
    const newAngle = Math.abs(Math.atan2(x, z));
    expect(newAngle).toBeCloseTo(maxTurn);
    expect(newAngle).toBeLessThan(Math.PI / 2);
  });
});
