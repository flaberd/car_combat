# Feature Specification: Core Vehicle Movement Loop

**Feature Branch**: `001-core-vehicle-loop`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "Core vehicle movement loop — the 'lock core loop first' foundational slice per the constitution (Principle VI: Core Loop Lock). A single player drives a vehicle around a grey-box arena in third-person view, using physically accurate motion. Core control mechanics: drive forward/reverse and steer, drift, turbo-boost. Twin-stick input scheme (movement axis + a second axis reserved for future aim/fire), keyboard as the concrete input method for this browser MVP milestone. Out of scope: combat, weapons, other vehicles/bots, destructible objects, match flow, HUD beyond what's needed to observe driving."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drive and Steer the Vehicle (Priority: P1)

As a player, I want to drive a vehicle around an arena so that I can experience direct, physically grounded control before any combat mechanics are added.

**Why this priority**: Without basic drive and steer, nothing else in the game is possible to build or evaluate. This is the atomic unit of the core loop and the first thing that must feel right.

**Independent Test**: Load the game, hold the forward/reverse/steer inputs, and observe the vehicle accelerating, reversing, and turning under physics-driven motion. Fully testable and demonstrable with no other feature present.

**Acceptance Scenarios**:

1. **Given** the vehicle is at rest in the arena, **When** the player holds the forward input, **Then** the vehicle accelerates forward under physics-driven motion (not scripted translation).
2. **Given** the vehicle is moving forward, **When** the player holds the steer input, **Then** the vehicle turns, with turning behavior influenced by current speed (realistic handling, not an instant snap-to-angle).
3. **Given** the vehicle is moving forward, **When** the player holds the reverse input, **Then** the vehicle decelerates and can move backward.
4. **Given** the vehicle is driving toward an arena boundary, **When** it reaches the boundary, **Then** it is physically stopped or deflected by the boundary geometry rather than passing through it.

---

### User Story 2 - Drift (Priority: P1)

As a player, I want to trigger a distinct drift state while cornering so that cornering feels skill-based and matches the control feel expected of the genre.

**Why this priority**: The constitution (Principle VI) marks drift as a core control mechanic required from the first driveable prototype, not an optional add-on — the control feel is incomplete without it.

**Independent Test**: While moving at speed and turning, activate the drift input and observe the vehicle enter a visibly different handling state (reduced lateral traction / sliding) compared to normal turning; release the input and observe a return to normal handling.

**Acceptance Scenarios**:

1. **Given** the vehicle is moving at speed and turning, **When** the player activates the drift input, **Then** the vehicle transitions into a slide state with reduced lateral traction, visibly distinct from normal turning.
2. **Given** the vehicle is in the drift state, **When** the player releases the drift input, **Then** the vehicle returns to normal traction/handling.
3. **Given** the vehicle is stationary or moving very slowly, **When** the player activates the drift input, **Then** little to no sliding occurs, since there is insufficient momentum to drift.

---

### User Story 3 - Turbo-Boost (Priority: P2)

As a player, I want a turbo-boost so that I can build extra speed for aggressive driving, setting up the future ramming mechanic.

**Why this priority**: Turbo is a core control mechanic per the constitution, but the drive/steer/drift loop must be functional first — turbo is additive on top of a working base loop.

**Independent Test**: With turbo available, activate the turbo input and observe a temporary increase in the vehicle's speed/acceleration; attempt to reactivate immediately and observe that turbo is unavailable until it recovers.

**Acceptance Scenarios**:

1. **Given** turbo is available, **When** the player activates the turbo input, **Then** the vehicle's speed/acceleration temporarily increases beyond its normal maximum.
2. **Given** turbo was just used, **When** the player attempts to activate turbo again immediately, **Then** turbo remains unavailable until its cooldown period has elapsed.
3. **Given** turbo's cooldown period has elapsed, **When** the player activates the turbo input again, **Then** turbo is available and functions as in Scenario 1.

---

### Edge Cases

- What happens when the vehicle collides with the arena boundary or static geometry while driving? The vehicle MUST be physically blocked/deflected by collision response (world-geometry collision only — no ramming/damage mechanic exists in this slice).
- What happens if drift and turbo are activated at the same time? Both effects MUST apply concurrently (increased speed from turbo, reduced lateral traction from drift) without causing erratic or broken physics behavior.
- What happens if the player provides no input? The vehicle MUST remain stationary (or coast to a stop if already moving), governed by the physics simulation's natural deceleration/friction.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a third-person camera that follows the player's vehicle as it moves through the arena.
- **FR-002**: System MUST let the player accelerate the vehicle forward and reverse via keyboard input.
- **FR-003**: System MUST let the player steer the vehicle left and right, with turning behavior driven by the physics simulation rather than scripted rotation.
- **FR-004**: System MUST provide a distinct drift input/action that shifts the vehicle into a lower-lateral-traction handling state while active, and restores normal handling when released.
- **FR-005**: System MUST provide a distinct turbo-boost input/action that temporarily increases the vehicle's speed/acceleration above its normal maximum.
- **FR-006**: Turbo-boost MUST be rate-limited by a cooldown period after each use, during which it cannot be reactivated. Exact cooldown duration and boost strength are tunable values to be set during implementation and refined through playtesting (see Assumptions) — this spec only requires that a limiter exists.
- **FR-007**: System MUST expose two independent input axes (a movement axis, and a second axis reserved for future aim/fire input) at the input-handling layer, even though only the movement axis drives behavior in this slice.
- **FR-008**: System MUST provide a grey-box arena consisting of a driveable ground surface and boundary geometry that physically contains the vehicle.
- **FR-009**: All vehicle motion — acceleration, steering, suspension, drift traction changes, turbo speed changes, and collision response — MUST be produced by Rapier's raycast vehicle controller and physics simulation, not by scripted/manual transform changes.
- **FR-010**: System MUST sustain 60 FPS during normal driving in the grey-box arena on the primary development hardware.

### Key Entities

- **Vehicle**: The player-controlled car. Key attributes: position/orientation (physics-driven), current speed, traction state (normal vs. drifting), turbo availability state (ready vs. on cooldown).
- **Arena**: The grey-box driving space. Key attributes: ground surface, boundary geometry that contains the vehicle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can begin driving within 5 seconds of the page finishing load, with no setup steps required.
- **SC-002**: A player can complete a full 360° turn around the arena using steering input alone, confirming steering responds continuously and predictably.
- **SC-003**: A player can deliberately enter and exit a drift state on demand while cornering, and the difference from normal turning is visibly obvious without instruction.
- **SC-004**: A player can trigger turbo-boost and observe a noticeable temporary speed increase, followed by a clearly enforced period where turbo cannot be reused.
- **SC-005**: Driving in the grey-box arena sustains 60 FPS on the primary development hardware, with no vehicle motion that appears decoupled from the physics simulation (e.g., no teleporting, no clipping through boundaries).

## Assumptions

- This slice contains a single vehicle only; no bots, opponents, or other players are present.
- Keyboard is the only input method implemented in this slice. The input layer exposes two independent axes (movement + a reserved second axis) to avoid rework when a future combat/aiming feature adds gamepad or touch support, per the constitution's Platform & Controls guidance — but binding gamepad/touch input is out of scope here.
- "Grey-box arena" means simple placeholder geometry (e.g., a flat ground plane plus basic boundary walls) with no art pass; it still uses the locked `.glb`/`.gltf` asset pipeline where meshes are needed.
- Turbo-boost's exact cooldown duration and speed multiplier are not fixed by this spec; a cooldown-based limiter (rather than a depletable meter) is the simplest mechanism consistent with the project's Simplicity & YAGNI principle, and the concrete numbers are expected to be tuned during implementation/playtesting.
- No HUD or UI is required beyond what naturally results from rendering the scene (e.g., no speedometer is required by this spec).
- No data persistence is required for this slice; nothing needs to be saved between sessions.
