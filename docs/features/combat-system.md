# Combat System

## Purpose

Ramming, the always-available machine gun, three vehicle archetypes, and
four pickup weapons — the combat layer built on top of the
[Core Vehicle Loop](core-vehicle-loop.md). Ramming and shooting are
co-equal core mechanics; see
[Core Loop Lock](../decisions/006-core-loop-lock.md).

---

## Scope

Ramming damage, vehicle archetypes, the machine gun, the four pickup
weapons (rockets, homing rockets, mines, oil slick), pickups, and the
current placeholder opponent (`SeekBot`). Does not cover match-level
win/loss flow (not yet built — see `docs/todo/knowledge-gaps.md`).

---

## Player Experience

- **Ramming**: driving into another vehicle deals damage to both vehicles
  simultaneously, proportional to each vehicle's own speed and mass at
  impact (see [Physics-Accurate Ramming Combat](../decisions/002-physics-accurate-ramming.md)).
- **Machine gun**: always available, unlimited ammo, limited only by fire
  rate — the baseline shooting option that needs no pickup. Hitscan (no
  travelling projectile mesh), so every shot draws a short-lived tracer
  line from muzzle to hit point (or to max range on a miss) as firing
  feedback — see `src/combat/machineGun.js`.
- **Archetypes**: the player picks Heavy, Light, or Balanced at spawn, each
  with distinct mass/HP/speed/handling/turbo.
- **Pickups**: fixed arena locations, each tied to one weapon type. Driving
  over one sets the player's pickup-weapon slot to that weapon (replacing
  whatever was held) and starts a respawn timer at that location.
- **Weapon switching**: cycling `switchWeaponPrev`/`switchWeaponNext` moves
  `selectedWeaponIndex` through the vehicle's collected `weaponSlots`.
- **Homing rockets**: require a target lock (via `src/combat/targeting.js`,
  360° search cone since the projectile launches in a lob arc) before they
  can be fired usefully.
- **Opponent**: a single `SeekBot` — steers toward the player and fires,
  with no pathfinding, difficulty levels, or tactics. This is an explicit,
  intentionally minimal placeholder (see
  [MVP Scope Discipline](../decisions/007-mvp-scope-discipline.md) and
  `docs/todo/knowledge-gaps.md`).

---

## Design Rules

Current values from `src/config/tuning.js` (tunable via playtesting):

**Archetypes** (`ARCHETYPES`):

| Archetype | Mass | Max HP | Max Speed | Turn | Turbo recharge (empty→full) | Turbo boost (×multiplier / seconds held to drain) |
|---|---|---|---|---|---|---|
| Heavy | 1500 | 150 | 40 | low (0.35) | 8s | ×1.4 / 2s |
| Light | 700 | 80 | 70 | high (0.65) | 4s | ×1.25 / 1.5s |
| Balanced | 1000 | 110 | 55 | medium (0.5) | 6s | ×1.3 / 1.75s |

Turbo is a held button, not a tap: it boosts continuously while held and
charge remains, drains at a rate that empties a full charge in the
"seconds held to drain" value above, and recharges at a rate that refills
an empty meter in the "recharge" value above — see
[Core Vehicle Loop](core-vehicle-loop.md).

**Ramming** (`RAM`): `damage = (speed − minImpactSpeed) × mass × k`, where
`k = 0.004` and `minImpactSpeed = 3` m/s (below this, a bump deals no
damage). A per-vehicle 1s cooldown after taking ram damage debounces
Rapier re-firing "contact started" on a sustained collision.

**Weapons** (`WEAPONS`):

| Weapon | Damage | Ammo/pickup | Notes |
|---|---|---|---|
| Machine gun | 3/hit | unlimited | fire rate 5/s, range 40m |
| Rockets | 35/hit | 5 | straight-line, speed 60 m/s, range 60m |
| Homing rockets | 25/hit | 3 | requires target lock, turn rate 4.5 rad/s, range 50m |
| Mines | 40 on trigger | 3 | trigger radius 3m, arm delay 1s, lifetime 30s |
| Oil slick | frictionMultiplier 0.3 | 2 | 8m trail (4 segments), effect lasts 3s |

**Pickups** (`PICKUPS`): respawn delay 15s after collection. Only one
pickup-type weapon can be held at a time — collecting a new one discards the
previous weapon's remaining ammo.

---

## Edge Cases and Constraints

- Both vehicles in a ramming collision always take some damage — there is
  no one-sided ram.
- A vehicle at 0 HP is eliminated (`eliminated = true`); it stops responding
  to input, and ramming/weapons no longer apply to it. No match-level
  win/loss flow consumes this yet.
- A homing rocket that loses its target continues toward the last known
  heading rather than losing guidance instantly.
- Driving through more than one active oil-slick trail does not stack the
  friction effect — re-entering an active trail refreshes its duration.
- A mine treats its own placer the same as any other vehicle once armed
  (the arm delay only prevents immediate self-detonation at placement).

---

## Implementation Entry Points

Systems

- `src/combat/ramming.js` — collision → damage
- `src/combat/machineGun.js` — always-available base weapon
- `src/combat/projectile.js` — rockets/homing rockets in flight
- `src/combat/targeting.js` — auto-target-acquisition (homing rockets)
- `src/combat/mine.js`, `src/combat/oilSlick.js` — deployable weapons
- `src/combat/pickup.js`, `src/combat/pickupWeaponUse.js` — pickup locations and weapon-slot logic
- `src/combat/registry.js` — active-entity bookkeeping
- `src/combat/seekBot.js` — placeholder opponent AI
- `src/ui/worldHealthBar.js`, `src/ui/hud.js` — HP/weapon feedback

Config

- `src/config/tuning.js` (`ARCHETYPES`, `RAM`, `WEAPONS`, `PICKUPS`)

Tests

- `tests/unit/ramming.test.js`, `tests/unit/machineGun.test.js`,
  `tests/unit/mine.test.js`, `tests/unit/oilSlick.test.js`,
  `tests/unit/pickupWeaponUse.test.js`, `tests/unit/projectile.test.js`,
  `tests/unit/targeting.test.js`

---

## Related Documents

- [Core Vehicle Loop](core-vehicle-loop.md)
- [Physics-Accurate Ramming Combat](../decisions/002-physics-accurate-ramming.md)
- [Core Loop Lock](../decisions/006-core-loop-lock.md)
- [MVP Scope Discipline](../decisions/007-mvp-scope-discipline.md)
- [Knowledge Gaps](../todo/knowledge-gaps.md)
