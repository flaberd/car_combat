# Phase 1 Data Model: Combat System — Ramming, Weapons, Archetypes, Pickups

No persisted/stored data (same as 001/003 — nothing survives a page reload).
Entities below are in-memory runtime state, extending 001's `Vehicle`/
`InputState` and reusing 003's touch-button pattern.

## ArchetypeConfig

A named stat profile (research.md §7), read from
`src/config/tuning.js`'s `ARCHETYPES` map.

| Field | Type | Notes |
|---|---|---|
| `id` | enum: `heavy` \| `light` \| `balanced` | |
| `mass` | number | Passed to the chassis collider's `.setMass()`, per FR-004. |
| `maxHp` | number | Starting/maximum health. |
| `maxSpeed` | number | Enforced as a hard clamp on forward speed (research.md §7). |
| `turnRate` | enum: `low` \| `medium` \| `high` | Maps to a steering-angle multiplier. |
| `turboCooldown`, `turboBoostMultiplier`, `turboBoostDuration` | number | Same shape as 001's `TURBO` tuning, now per-archetype. |

## Vehicle (extends 001-core-vehicle-loop's Vehicle)

| Field | Type | Notes |
|---|---|---|
| *(001 fields)* | — | `chassisBody`, `controller`, `mesh`, `wheelMeshes`, `wheelDefs`, `tractionState`, `turbo` — unchanged. |
| `archetype` | `ArchetypeConfig` | Set at spawn; drives mass/hp/speed-cap/turn-rate/turbo. |
| `hp` | number | Current health; starts at `archetype.maxHp`. |
| `eliminated` | boolean | `true` once `hp <= 0`. An eliminated vehicle stops responding to input and ramming/weapons no longer apply to it (Edge Cases: no further outcome resolution — that's a future match-flow feature). |
| `machineGunCooldownRemaining` | number (seconds) | Counts down; fire is allowed only at `0`. |
| `pickupWeapon` | `PickupWeaponSlot \| null` | The currently held pickup-type weapon, or `null` if none collected/all ammo spent. |

**Validation / invariants** (carried over from Principle II, now applied to
ramming too): all HP changes from ramming or weapons MUST be computed from
data read at the moment of a physics collision/hit event (research.md §1/
§3), never scripted based on game-logic-only state.

## PickupWeaponSlot

| Field | Type | Notes |
|---|---|---|
| `type` | enum: `rockets` \| `homingRockets` \| `mines` \| `oilSlick` | |
| `ammo` | number | Decrements by 1 per use; slot becomes `null` on the vehicle at 0. |
| `lockState` | `{ progress: number, targetVehicle: Vehicle \| null } \| null` | Only meaningful for `homingRockets` — tracks hold-to-lock progress (research.md §9) while `InputState.usePickup` is held. |

## Pickup

A fixed arena location offering one weapon type (spec Key Entities:
Pickup).

| Field | Type | Notes |
|---|---|---|
| `position` | Vector3 | Fixed, designer-placed (spec Non-Goals: no randomization). |
| `weaponType` | Same enum as `PickupWeaponSlot.type` | |
| `sensorCollider` | Rapier sensor collider (research.md §2) | Detects vehicle overlap. |
| `available` | boolean | `false` while on cooldown after collection. |
| `respawnRemaining` | number (seconds) | Counts down from 15 while `available === false`. |

## Projectile (Rocket / Homing Rocket)

Kinematic, non-physics-body (research.md §4).

| Field | Type | Notes |
|---|---|---|
| `kind` | enum: `rocket` \| `homingRocket` | |
| `position`, `velocity` | Vector3 | Advanced manually each frame. |
| `ownerVehicle` | `Vehicle` | Excluded from its own hit detection. |
| `target` | `Vehicle \| null` | Only set for `homingRocket`, from the lock acquired via `PickupWeaponSlot.lockState`. |
| `remainingRange` | number | Distance-based expiry (rocket 60m / homing rocket 50m, per spec). |

## Mine

| Field | Type | Notes |
|---|---|---|
| `position` | Vector3 | Set at deployment (behind/at the depositing vehicle). |
| `sensorCollider` | Rapier sensor collider | `trigger_radius` sized (research.md §2/§5). |
| `armDelayRemaining` | number (seconds) | Inert (ignores collision events) while `> 0`. |
| `lifetimeRemaining` | number (seconds) | Despawns at `0` if untriggered. |

## OilSlickSegment

One patch of an oil-slick trail (research.md §6); several are spawned
together to form the spec's 8m trail.

| Field | Type | Notes |
|---|---|---|
| `sensorCollider` | Rapier sensor collider | |
| `lifetimeRemaining` | number (seconds) | Segment despawns at `0`. |
| `occupantVehicles` | `Set<Vehicle>` | Vehicles currently overlapping this segment, tracked via collision `started`/`stopped` (research.md §2) — each gets the friction-reduction effect applied via 001's `applyTractionState` mechanism while present. |

## SeekBot (opponent, research.md §10)

| Field | Type | Notes |
|---|---|---|
| `vehicle` | `Vehicle` | The bot's own vehicle instance (heavy/light/balanced, tunable but not spec-mandated which). |
| `targetVehicle` | `Vehicle` | The player's vehicle. |

No additional state beyond a per-frame computed `InputState` (steer-toward-
target + constant throttle + conditional `fire`); no drift/turbo/pickup use
in this slice (Assumptions).

## InputState (extends 001/003's InputState — new fields only)

| Field | Type | Notes |
|---|---|---|
| `fire` | boolean | Held. Drives the machine gun while `true` and `machineGunCooldownRemaining === 0`. |
| `usePickup` | boolean | Held. Rising edge triggers instant-use weapons (rockets/mines/oil slick); held duration drives homing-rocket lock-on. |

`moveAxis`, `aimAxis`, `drift`, `turbo` are unchanged from 001/003.
`aimAxis` remains unbound in this feature too (research.md §9).
