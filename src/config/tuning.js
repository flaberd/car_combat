// Centrally editable balance/tuning constants.
// See specs/001-core-vehicle-loop/data-model.md "Tuning Configuration" and
// specs/002-combat-system/data-model.md ArchetypeConfig.

// Chassis/wheel geometry shared by all archetypes (structural, not a
// balance stat called out by any spec) — the "car model" is reskinned by
// ARCHETYPES' mass/hp/speed/turn/turbo stats, not by shape.
export const VEHICLE_SHAPE = {
  chassisHalfExtents: { x: 0.9, y: 0.4, z: 2.0 },
  brakeForce: 40,
  wheelRadius: 0.4,
  suspensionRestLength: 0.6,
  wheelBaseHalf: 1.6, // distance from chassis center to front/rear axle, along local z
  trackHalf: 0.8, // distance from chassis center to left/right wheel, along local x
};

// Per-archetype stats (specs/002-combat-system/spec.md Vehicle Archetypes).
// Starting values, expected to be tuned via playtesting.
export const ARCHETYPES = {
  heavy: {
    id: "heavy",
    mass: 1500,
    maxHp: 150,
    maxSpeed: 40,
    engineForce: 2400,
    maxSteerAngle: 0.35, // low turn rate / poor handling
    turboCooldown: 8,
    turboBoostMultiplier: 1.4,
    turboBoostDuration: 2,
  },
  light: {
    id: "light",
    mass: 700,
    maxHp: 80,
    maxSpeed: 70,
    engineForce: 1400,
    maxSteerAngle: 0.65, // high turn rate
    turboCooldown: 4,
    turboBoostMultiplier: 1.25,
    turboBoostDuration: 1.5,
  },
  balanced: {
    id: "balanced",
    mass: 1000,
    maxHp: 110,
    maxSpeed: 55,
    engineForce: 1800,
    maxSteerAngle: 0.5, // medium turn rate
    turboCooldown: 6,
    turboBoostMultiplier: 1.3,
    turboBoostDuration: 1.75,
  },
};

export const DRIFT = {
  minSpeedForEffect: 4,
  normalSideFriction: 3.0,
  driftSideFriction: 0.35,
};

export const CAMERA = {
  offset: { x: 0, y: 3.2, z: -7 },
  lookAtOffset: { x: 0, y: 1, z: 2 },
  followLerp: 4.5,
};

// Ramming damage formula (specs/002-combat-system/spec.md): damage dealt to
// the OTHER vehicle = this vehicle's own speed * mass * k, symmetric.
export const RAM = {
  k: 0.01,
  // Per-vehicle debounce after taking ram damage: a single sustained ram
  // can make Rapier re-fire a "contact started" event several times as the
  // bodies jitter against each other, so this stops that from being
  // counted as repeated separate rams (src/combat/ramming.js).
  cooldown: 1,
};

export const WEAPONS = {
  machineGun: {
    damagePerHit: 3,
    fireRate: 5, // shots/sec; cooldown between shots = 1 / fireRate
    range: 40,
  },
  rockets: {
    damagePerHit: 35,
    ammoPerPickup: 5,
    projectileSpeed: 60,
    range: 60,
  },
  homingRockets: {
    damagePerHit: 25,
    ammoPerPickup: 3,
    lockOnTime: 1.5,
    projectileSpeed: 45,
    turnRate: 2.2, // radians/sec the projectile can steer toward its target
    range: 50,
  },
  mines: {
    damageOnTrigger: 40,
    ammoPerPickup: 3,
    triggerRadius: 3,
    armDelay: 1,
    lifetime: 30,
  },
  oilSlick: {
    frictionMultiplier: 0.3,
    effectDuration: 3,
    ammoPerPickup: 2,
    trailLength: 8,
    segmentCount: 4,
  },
};

export const PICKUPS = {
  respawnDelay: 15,
};
