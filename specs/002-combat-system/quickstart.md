# Quickstart: Validating the Combat System

Manual/headless-browser validation guide for `002-combat-system`, mapped to
`spec.md`'s acceptance scenarios and success criteria. Per `research.md`
§11, combat feel and hit registration are validated here rather than by
automated test — same approach as 001 and 003.

## Prerequisites

- Repository checked out with this feature implemented (on top of 001 and
  003).
- A browser with WebGL2 support.

## Setup

```bash
npm install
npm run dev
```

## Automated checks (run before manual validation)

```bash
npm run test   # Vitest: ramming formula, archetype lookup, weapon/lock state machines
```

## Manual validation scenarios

All scenarios assume the Start Gate (003) has been passed and an archetype
has been selected (new pre-gameplay step from this feature — see Scenario 0).

### 0. Archetype selection (US3)

1. After tapping Start, confirm a Heavy / Light / Balanced selection screen
   appears before the vehicle spawns.
2. Pick each archetype in turn (separate loads) and confirm the spawned
   vehicle's top speed and turning response differ noticeably between them.

### 1. Ramming combat (US1, SC-001)

1. Spawn as any archetype, drive the SeekBot opponent down, and ram it at
   moderate speed. **Expect**: both vehicles' health drops immediately on
   impact.
2. Ram again at high speed with a heavier archetype. **Expect**: the
   opponent takes proportionally more damage than a low-speed/light-archetype
   ram; your own vehicle also takes some damage from the same impact.
3. Ram repeatedly until either vehicle's HP reaches 0. **Expect**: that
   vehicle stops responding to input/further damage (eliminated).

### 2. Machine gun (US2, SC-002)

1. Without collecting any pickup, hold Fire (`KeyF` / on-screen Fire
   button) while facing the opponent within range. **Expect**: repeated
   hits at the weapon's fire rate, opponent health decreasing.
2. Aim (drive-facing) away so the opponent is out of range/behind you and
   hold Fire. **Expect**: no hits registered.
3. Continue firing until the opponent's HP reaches 0 using only the
   machine gun. **Expect**: elimination, confirming shooting alone is
   viable (ram/shoot parity).

### 3. Pickups and weapon switching (US4)

1. Drive over a pickup location. **Expect**: the corresponding weapon
   becomes active immediately; the pickup location disappears.
2. Wait 15 seconds. **Expect**: the pickup reappears at the same location.
3. Drive over a second, different pickup while still holding ammo from the
   first. **Expect**: the new weapon replaces the old one (old ammo
   discarded); machine gun remains available throughout via Fire.

### 4. Rockets and homing rockets (US4)

1. With rockets held, hold Use (`KeyE` / on-screen Use button) facing the
   opponent. **Expect**: a projectile travels in a straight line and
   damages the opponent on contact within range.
2. With homing rockets held, hold Use with the opponent roughly ahead.
   **Expect**: after ~1.5s a lock is acquired and the rocket auto-fires,
   adjusting its path toward the opponent as it flies; a sharp opponent
   direction change can still cause it to miss.

### 5. Mines and oil slick (US4)

1. With mines held, tap Use to deploy one, then drive away and have the
   SeekBot approach it after the arm delay. **Expect**: the mine detonates
   on contact, damaging the bot; a mine left untriggered for 30s despawns.
2. With oil slick held, tap Use while driving. **Expect**: an 8m trail is
   deposited; driving (yours or the bot's) through it noticeably reduces
   traction for a few seconds.

## Done criteria

All scenarios above behave as expected, and `npm run test` passes. This
satisfies `spec.md`'s Success Criteria SC-001 through SC-006.
