# Feature Specification: Combat System — Ramming, Weapons, Archetypes, Pickups

**Feature Branch**: `002-combat-system`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "Combat System — Ramming, Weapons, Vehicle Archetypes, Pickups. Second vertical slice, building on 001-core-vehicle-loop. Resolves the constitution's deferred Open Design Questions (vehicle archetypes, weapon balance, ram vs. shoot balance) with concrete values: universal ramming formula (speed × mass × k, symmetric damage), 3 vehicle archetypes (Heavy/Light/Balanced) with distinct mass/hp/max_speed/turn_rate/turbo stats, a machine gun base weapon plus 4 fixed-location pickup weapons (rockets, homing rockets, mines, oil slick) with specified stats, and a pickup system where a pickup replaces the current pickup-type weapon slot and respawns after 15s."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ramming Combat (Priority: P1)

As a player, I want colliding with an opponent's vehicle to deal real, physics-based damage to both vehicles so that ramming is a genuine risk/reward decision, not a free attack.

**Why this priority**: Ramming is the genre-defining mechanic and a constitution-mandated core principle (Principle II, Principle VI ram/shoot parity). Without it, none of the other combat systems have a foundation to compare against.

**Independent Test**: Drive the player vehicle into an opponent vehicle at varying speeds and observe that both vehicles lose health, in proportion to their own speed and mass at the moment of impact — fully testable with just two vehicles and no weapons involved.

**Acceptance Scenarios**:

1. **Given** two vehicles on a collision course, **When** they collide, **Then** both vehicles take damage simultaneously, each computed from that vehicle's own speed and mass at impact (not just the "attacker's").
2. **Given** a heavier/faster vehicle rams a lighter/slower one, **When** the collision resolves, **Then** the heavier/faster vehicle deals more damage than it receives, reflecting the risk/reward trade-off (moving fast and heavy is more dangerous to both parties, but favors the rammer).
3. **Given** a vehicle's health reaches zero from ramming damage, **When** this occurs, **Then** the vehicle is eliminated, using the same elimination outcome as any other damage source.

---

### User Story 2 - Base Weapon: Machine Gun (Priority: P1)

As a player, I want an always-available ranged weapon so that shooting is as viable and immediate a combat option as ramming.

**Why this priority**: For ram/shoot parity (Principle VI) to mean anything, a baseline shooting option must exist without depending on pickup availability. This is the second half of the minimum viable combat loop, alongside ramming.

**Independent Test**: Fire the machine gun at an opponent from various ranges and observe repeated hits reducing the opponent's health, with no ammo constraint ever blocking firing.

**Acceptance Scenarios**:

1. **Given** a player vehicle facing an opponent within range, **When** the player fires the machine gun, **Then** the opponent takes damage per hit, and the player can keep firing at the weapon's fire rate indefinitely (unlimited ammo).
2. **Given** an opponent beyond the machine gun's range, **When** the player fires, **Then** no hit/damage occurs.
3. **Given** a player using only the machine gun (no pickups collected), **When** sustained fire connects, **Then** it is possible to fully deplete an opponent's health through machine gun damage alone.

---

### User Story 3 - Vehicle Archetypes (Priority: P2)

As a player, I want to drive one of three distinct vehicle archetypes (Heavy, Light, Balanced) so that my choice of vehicle meaningfully changes how I fight — favoring ramming, agility, or an even mix.

**Why this priority**: Archetypes give ramming and shooting their strategic depth (a Heavy vehicle rams harder but handles poorly; a Light vehicle is agile but fragile) but the combat mechanics from User Stories 1–2 must exist first for archetype differences to be observable at all.

**Independent Test**: Spawn each of the three archetypes in turn and compare top speed, handling, and how much damage each deals/receives when ramming at the same speed — differences should be immediately observable without needing weapons.

**Acceptance Scenarios**:

1. **Given** the game offers archetype selection, **When** a player picks Heavy, Light, or Balanced, **Then** the spawned vehicle has that archetype's mass, health, max speed, turn rate, and turbo characteristics.
2. **Given** two different archetypes collide with each other at the same speed, **When** the collision resolves, **Then** the resulting damage to each differs according to their respective mass, per the ramming formula (User Story 1).
3. **Given** a Heavy vehicle and a Light vehicle both attempt the same turn at the same speed, **When** observed, **Then** the Light vehicle turns more sharply, reflecting its higher turn rate.

---

### User Story 4 - Pickup Weapons (Priority: P3)

As a player, I want to collect rockets, homing rockets, mines, or oil slicks from fixed points on the arena so that combat has more tactical variety beyond ramming and the base machine gun.

**Why this priority**: Pickup weapons add depth and variety but are not required for the combat loop to function — ramming and the machine gun already form a complete, testable combat experience (User Stories 1–2). Pickups are the enrichment layer.

**Independent Test**: Walk the vehicle over each pickup type in turn, fire/deploy each resulting weapon, and confirm its specific documented effect (direct damage, homing behavior, delayed-trigger area damage, or friction reduction) occurs — testable pickup by pickup, independent of the others.

**Acceptance Scenarios**:

1. **Given** a pickup location on the arena, **When** the player's vehicle drives over it, **Then** the player's active pickup-type weapon slot is set to that pickup's weapon (replacing whatever pickup weapon, if any, was previously held), and the pickup location becomes unavailable.
2. **Given** a pickup was just collected, **When** 15 seconds elapse, **Then** the pickup becomes available again at the same location.
3. **Given** the player holds rockets, **When** fired, **Then** a projectile travels in a straight line and deals its damage to whatever it contacts within its range.
4. **Given** the player holds homing rockets and has a target locked for the required lock-on duration, **When** fired, **Then** the rocket adjusts its trajectory toward the target as it flies, though a target changing direction sharply enough can still avoid it.
5. **Given** the player deploys a mine, **When** the arm delay has elapsed and another vehicle comes within the trigger radius, **Then** the mine detonates, dealing its damage; **When** the mine's lifetime elapses without being triggered, **Then** it disappears.
6. **Given** the player deploys oil slick while driving, **When** any vehicle drives through the resulting trail, **Then** that vehicle's traction is reduced for the effect's duration.

---

### Edge Cases

- What happens when two vehicles collide head-on hard enough that both would be reduced to zero health? Both are eliminated simultaneously; this spec does not define any special "draw" handling beyond applying the ramming formula to both (match-outcome handling belongs to a future match-flow feature).
- What happens if a player collects a new pickup weapon while still holding unused ammo in the current one? The previous pickup weapon and its remaining ammo are discarded; only one pickup-type weapon can be held at a time.
- What happens if a homing rocket's target moves out of range or breaks line of sight mid-flight? The rocket continues toward its last known target heading rather than instantly losing all guidance, until it reaches maximum range and expires.
- What happens if a vehicle drives through more than one active oil slick trail? The friction effect does not stack; re-entering an active trail simply refreshes the effect's duration.
- What happens if the vehicle that placed a mine drives back over it after the arm delay has elapsed? The mine treats all vehicles equally once armed, including its own placer — the arm delay only protects against immediate self-detonation at the moment of placement.
- What happens when the machine gun is fired continuously? It is limited only by its fire rate (no separate ammo or cooldown constraint), so sustained fire at the stated fire rate is always possible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST compute ramming damage for a vehicle-vehicle collision as a function of that vehicle's own speed and mass at the moment of impact, applied symmetrically so both vehicles in the collision take damage simultaneously.
- **FR-002**: System MUST NOT apply ramming damage to only one side of a collision — both vehicles always take some damage based on their own collision-moment speed and mass.
- **FR-003**: System MUST provide a machine gun weapon that is available to the player at all times, has unlimited ammunition, and is limited only by its fire rate.
- **FR-004**: System MUST support exactly three vehicle archetypes (Heavy, Light, Balanced), each with a distinct mass, maximum health, maximum speed, turn rate, and turbo-boost behavior (cooldown duration and boost strength/duration).
- **FR-005**: Archetype mass differences MUST produce observably different ramming outcomes (per FR-001) when vehicles of different archetypes collide.
- **FR-006**: System MUST provide four pickup weapon types — rockets, homing rockets, mines, and oil slick — each spawned at fixed, non-random locations on the arena.
- **FR-007**: System MUST allow a player to hold at most one pickup-type weapon at a time; collecting a new pickup weapon replaces the previously held one.
- **FR-008**: A collected pickup location MUST become available again after a fixed respawn delay.
- **FR-009**: Rockets MUST travel in a straight line from firing point and deal their damage on contact with a target within their range.
- **FR-010**: Homing rockets MUST require a lock-on period before firing and, once fired, MUST adjust their trajectory toward the locked target during flight, while remaining evadable by a sufficiently sharp change in the target's direction.
- **FR-011**: Mines MUST be inert for a fixed arm delay after being placed, then become active and detonate when any vehicle enters their trigger radius, dealing their damage; a mine MUST also expire and disappear if untriggered after its lifetime elapses.
- **FR-012**: Oil slick MUST deposit a temporary trail behind the depositing vehicle; any vehicle (including the depositor) driving through the active trail MUST have its traction reduced for the effect's stated duration.
- **FR-013**: All numeric balance values referenced in this spec (per-archetype stats, per-weapon stats, the ramming coefficient) MUST be stored in a single, centrally editable location, separate from behavior/logic code, so they can be rebalanced without touching multiple systems.
- **FR-014**: System MUST provide at least one opponent vehicle so that ramming and shooting mechanics can be exercised in play (see Assumptions for the scope of this opponent's behavior in this slice).

### Key Entities

- **Vehicle**: Extends the vehicle from 001-core-vehicle-loop with an archetype (Heavy/Light/Balanced), current/maximum health, and a currently held pickup-type weapon (if any) with remaining ammo.
- **Vehicle Archetype**: A named stat profile (mass, max health, max speed, turn rate, turbo cooldown, turbo boost strength/duration) applied to a vehicle at spawn.
- **Weapon**: The machine gun (always-available baseline) or one of the four pickup weapon types; each has its own damage/behavior stats.
- **Pickup**: A fixed arena location associated with one weapon type, with an available/collected state and a respawn timer.
- **Projectile**: A fired rocket or homing rocket in flight, tracking position, velocity/heading, and (for homing rockets) its locked target.
- **Mine**: A deployed, stationary hazard tracking its armed state, trigger radius, and remaining lifetime.
- **Oil Slick Trail**: A temporary ground-effect zone behind a vehicle that deployed oil slick, tracking its remaining duration and the friction reduction it applies.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In any vehicle-vehicle collision, both vehicles show reduced health afterward — there is no observed case where only one side takes damage.
- **SC-002**: A player using only the machine gun (no pickups collected) can reduce an opponent from full health to eliminated, confirming shooting alone is a complete path to victory.
- **SC-003**: Each of the three archetypes, driven under identical conditions, shows a measurably different top speed and turning response from the other two.
- **SC-004**: A player driving over any pickup location receives that weapon immediately (within the same interaction, no delay or extra step), and the location becomes available again within 15 seconds of collection.
- **SC-005**: Each of the four pickup weapon types, when used, produces its own distinct, observable effect (direct impact damage, homing flight behavior, delayed-then-persistent area trigger, or temporary traction reduction) — a player can tell them apart by outcome alone.
- **SC-006**: A single balance value (e.g., machine gun damage per hit) can be changed in one place and take effect the next time the game runs, without edits anywhere else.

## Assumptions

- **Opponent presence in this slice**: this feature includes exactly one opponent vehicle with minimal placeholder behavior (e.g., simple scripted movement toward the player, or a stationary/lightly-moving target) — just enough presence for ramming and shooting to be exercised and tested. A fully-featured bot AI (pathfinding, difficulty levels, tactical decision-making) is explicitly out of scope for this spec and is expected to be defined in a later feature, consistent with the constitution's MVP scope (single-player vs. bots).
- The ramming coefficient (`k`) and all archetype/weapon numeric values given are starting points, expected to be tuned via playtesting after this slice is implemented — this spec requires the mechanism (formula, stat differences, centrally editable values) to exist and behave correctly, not that the initial numbers are final.
- No match-level win/loss flow (e.g., what happens when the opponent is eliminated, round restart) is defined by this spec — that belongs to a future match-flow feature. This slice only requires that health can reach zero and elimination is recognized as an outcome.
- No UI/HUD requirement beyond what's needed to observe health, held pickup weapon, and turbo/ammo availability during play — exact presentation is an implementation choice.
- Whether the machine gun and rockets are implemented as hitscan or simulated projectiles is an implementation choice; this spec only requires the specified damage, range, and (for rockets) straight-line travel behavior to be observable.

## Non-Goals

- Randomized pickup spawn locations — pickups spawn at fixed, designer-placed locations only for this MVP slice.
- Kill-streak or damage-combo systems.
- Weapon upgrades or progression between matches.
- Full bot AI (pathfinding, difficulty tuning, tactical behavior) — this slice's opponent uses minimal placeholder behavior only (see Assumptions).
