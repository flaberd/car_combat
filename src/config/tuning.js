// Centrally editable balance/tuning constants for the core vehicle loop.
// See specs/001-core-vehicle-loop/data-model.md "Tuning Configuration".
// 002-combat-system will extend this same file with archetype/weapon stats.

export const VEHICLE = {
  chassisHalfExtents: { x: 0.9, y: 0.4, z: 2.0 },
  chassisMass: 1000,
  engineForce: 1800,
  brakeForce: 40,
  maxSteerAngle: 0.5,
  wheelRadius: 0.4,
  suspensionRestLength: 0.6,
  wheelBaseHalf: 1.6, // distance from chassis center to front/rear axle, along local z
  trackHalf: 0.8, // distance from chassis center to left/right wheel, along local x
};

export const DRIFT = {
  minSpeedForEffect: 4,
  normalSideFriction: 3.0,
  driftSideFriction: 0.35,
};

export const TURBO = {
  boostForceMultiplier: 1.6,
  boostDuration: 1.75,
  cooldownDuration: 6,
};

export const CAMERA = {
  offset: { x: 0, y: 3.2, z: -7 },
  lookAtOffset: { x: 0, y: 1, z: 2 },
  followLerp: 4.5,
};
