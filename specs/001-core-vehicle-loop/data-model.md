# Phase 1 Data Model: Core Vehicle Movement Loop

This feature has no persisted/stored data (per spec Assumptions: "No data
persistence is required for this slice"). The entities below are in-memory
runtime state for a single play session, not database records.

## Vehicle

The player-controlled car (spec Key Entities: Vehicle).

| Field | Type | Notes |
|---|---|---|
| `chassisBody` | Rapier `RigidBody` | Physics source of truth for position/orientation/velocity (Principle II/IX — no separate manually-tracked transform). |
| `vehicleController` | Rapier `DynamicRayCastVehicleController` | Wraps `chassisBody`; owns the 4 raycast wheels. |
| `tractionState` | enum: `normal` \| `drifting` | Drives which side-friction value is currently applied to the wheels. |
| `turboState` | `TurboState` (below) | Tracks turbo availability. |

**Relationships**: A Vehicle owns exactly one `TurboState` and drives its
`tractionState` from `InputState.drift`. This feature has exactly one
Vehicle instance (single-player, no opponents — see spec Assumptions).

**Validation / invariants**:
- `tractionState` MUST be `drifting` if and only if the drift input is
  currently held AND the vehicle's speed is above a small minimum threshold
  (FR-004, Edge Cases: no meaningful drift at near-zero speed).
- Vehicle position/rotation MUST only change via physics simulation steps
  (Principle II) — no code path may set chassis transform directly.

## TurboState

Tracks the turbo-boost cooldown/availability state machine (FR-005, FR-006).

| Field | Type | Notes |
|---|---|---|
| `status` | enum: `ready` \| `boosting` \| `cooling_down` | Current state. |
| `boostElapsed` | number (seconds) | Time since boost activation; only meaningful while `status === 'boosting'`. |
| `cooldownElapsed` | number (seconds) | Time since boost ended; only meaningful while `status === 'cooling_down'`. |

**State transitions**:

```text
ready --(turbo input pressed)--> boosting
boosting --(boost duration elapsed)--> cooling_down
cooling_down --(cooldown duration elapsed)--> ready
```

No transition exists directly from `boosting` or `cooling_down` back to
`boosting` (Edge Cases / FR-006: turbo cannot be reactivated until its
cooldown fully elapses). `boostDuration` and `cooldownDuration` are values
read from the centrally-configurable tuning source described below — this
slice ships with placeholder single-archetype values since archetype
differentiation (Heavy/Light/Balanced turbo stats) belongs to
`002-combat-system`.

## InputState

Normalized, device-independent representation of player intent for the
current frame (FR-002–FR-005, FR-007).

| Field | Type | Notes |
|---|---|---|
| `moveAxis` | `{ x: number, y: number }`, each in `[-1, 1]` | Movement axis: `y` = throttle/reverse, `x` = steering. Sourced from keyboard in this slice. |
| `aimAxis` | `{ x: number, y: number }`, each in `[-1, 1]` | Second, currently-unbound axis reserved for future aim/fire (FR-007). Always `{0, 0}` in this slice. |
| `drift` | boolean | Drift input held. |
| `turbo` | boolean | Turbo input pressed (edge-triggered for activation, per `TurboState` transitions). |

**Relationships**: Produced each frame by the input layer (keyboard →
`InputState` mapping) and consumed by the Vehicle's control step. This
separation is what lets `aimAxis` exist now with no behavior bound to it,
ready for `002-combat-system` to consume it without reworking the input
layer (FR-007).

## Arena

The grey-box driving space (spec Key Entities: Arena).

| Field | Type | Notes |
|---|---|---|
| `groundBody` | Rapier `RigidBody` (fixed) | Static collider for the drivable ground plane. |
| `boundaryBodies` | Rapier `RigidBody[]` (fixed) | Static colliders that physically contain the vehicle (FR-008; Edge Cases: boundary collision). |

**Validation / invariants**: All Arena bodies are static/fixed — the arena
itself never moves; only the Vehicle does.

## Tuning Configuration (centrally editable values)

Not an "entity" in the traditional sense, but required by FR-006's
implied need for tunable turbo values and by this feature's general
practice of not hardcoding magic numbers. A single module exports named
constants for: turbo boost strength/duration, turbo cooldown duration,
drift side-friction multiplier, engine force, steering limits. This is the
001-scope precursor to the shared balance-config file that
`002-combat-system` FR-013 formally requires for archetype/weapon stats —
001 establishes the pattern with its own smaller set of values so 002 can
extend the same file rather than introducing a second convention.
