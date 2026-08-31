import { describe, expect, it } from "vitest";
import { computeHomingVelocity3D } from "../../src/combat/projectile.js";

describe("computeHomingVelocity3D", () => {
  it("preserves speed magnitude while turning", () => {
    const { x, y, z } = computeHomingVelocity3D(
      { x: 0, y: 10, z: 0 },
      { x: 10, y: 0, z: 0 },
      Math.PI / 4,
    );
    expect(Math.hypot(x, y, z)).toBeCloseTo(10);
  });

  it("turns toward the target direction, clamped by maxTurnRadians", () => {
    // Moving straight up, target is directly to the +x side (90 deg away).
    const maxTurn = 0.2; // radians this step
    const { x, y, z } = computeHomingVelocity3D(
      { x: 0, y: 10, z: 0 },
      { x: 10, y: 0, z: 0 },
      maxTurn,
    );
    const speed = Math.hypot(x, y, z);
    // Angle actually turned away from straight-up should be ~maxTurn.
    const angleFromUp = Math.acos(y / speed);
    expect(angleFromUp).toBeCloseTo(maxTurn, 4);
  });

  it("does not overshoot when the required turn is within maxTurnRadians", () => {
    const from = { x: 0, y: 10, z: 0 };
    const to = { x: 1, y: 10, z: 0 }; // small angle away from straight-up
    const result = computeHomingVelocity3D(from, to, Math.PI / 2);

    const fromLen = Math.hypot(from.x, from.y, from.z);
    const toLen = Math.hypot(to.x, to.y, to.z);
    const desiredAngle = Math.acos(
      (from.x * to.x + from.y * to.y + from.z * to.z) / (fromLen * toLen),
    );

    const resultLen = Math.hypot(result.x, result.y, result.z);
    const actualAngle = Math.acos(
      (from.x * result.x + from.y * result.y + from.z * result.z) /
        (fromLen * resultLen),
    );
    expect(actualAngle).toBeCloseTo(desiredAngle, 4);
  });

  it("returns velocity unchanged when target direction is degenerate (zero vector)", () => {
    const result = computeHomingVelocity3D({ x: 3, y: 4, z: 0 }, { x: 0, y: 0, z: 0 }, 0.5);
    expect(result).toEqual({ x: 3, y: 4, z: 0 });
  });

  it("returns velocity unchanged when current speed is ~zero", () => {
    const result = computeHomingVelocity3D({ x: 0, y: 0, z: 0 }, { x: 5, y: 5, z: 0 }, 0.5);
    expect(result).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("a sharp enough target-direction change can still evade within one step (bounded turn)", () => {
    // Target suddenly mostly-behind (~153 deg from straight-up, not exactly
    // antipodal) — with a small turn rate, the rocket can only partially
    // correct.
    const maxTurn = 0.1;
    const { x, y, z } = computeHomingVelocity3D(
      { x: 0, y: 10, z: 0 },
      { x: 5, y: -10, z: 0 },
      maxTurn,
    );
    const speed = Math.hypot(x, y, z);
    const angleFromUp = Math.acos(Math.min(1, Math.max(-1, y / speed)));
    expect(angleFromUp).toBeCloseTo(maxTurn, 4);
    expect(angleFromUp).toBeLessThan(Math.PI / 2);
  });

  it("snaps to the target direction when it's exactly opposite (degenerate axis)", () => {
    const result = computeHomingVelocity3D({ x: 0, y: 10, z: 0 }, { x: 0, y: -5, z: 0 }, Math.PI);
    expect(result.y).toBeCloseTo(-10);
    expect(result.x).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
  });
});
