# Module Overview

## Responsibility

`src/` is organized by subsystem, not by MVC layer — each folder owns one
concern of the game loop. This document is the map between those folders
and what they're responsible for; feature-level behavior lives in
[docs/features/](../features/).

---

## `src/physics`

**Responsibility**: Rapier world creation and stepping. The single source
of truth for all motion (see
[Physics-Accurate Ramming Combat](../decisions/002-physics-accurate-ramming.md)).

**Boundaries**: No gameplay logic here — just world setup/step
(`src/physics/world.js`).

---

## `src/arena`

**Responsibility**: The grey-box driving space — ground plane and static
boundary colliders.

**Boundaries**: Static geometry only; nothing here moves or holds
per-vehicle state.

---

## `src/vehicle`

**Responsibility**: The player/bot-controlled car — chassis/wheel setup on
top of Rapier's raycast vehicle controller, drift traction switching, and
the turbo charge meter.

**Boundaries**: Archetype stats (mass/HP/speed/turn/turbo values) are data,
owned by `src/config/tuning.js`; this module consumes them but does not
define them.

**Collaborators**: `src/physics`, `src/input` (reads `InputState`),
`src/config/tuning.js`.

---

## `src/combat`

**Responsibility**: Everything combat — ramming damage, the machine gun,
projectiles (rockets/homing rockets), mines, oil slick, pickups, weapon-slot
inventory, targeting/auto-lock, the placeholder opponent (`seekBot.js`), and
a small entity registry for active combat objects.

**Boundaries**: Reads vehicle state (position/velocity/mass via Rapier) but
does not own vehicle control — see [Combat System](../features/combat-system.md)
for player-facing behavior and current balance values.

**Collaborators**: `src/vehicle`, `src/physics`, `src/config/tuning.js`,
`src/ui` (health bar/HUD feedback).

---

## `src/input`

**Responsibility**: Produces the device-independent `InputState` each
frame, from either keyboard (`inputState.js`, `inputController.js`) or
touch (`touchInput.js`, `virtualJoystick.js`, `orientationGate.js`,
`startGate.js`).

**Boundaries**: Never reaches into vehicle/combat state directly — only
produces `InputState`, which other modules read. See
[Core Vehicle Loop](../features/core-vehicle-loop.md) and
[Mobile Touch Controls](../features/mobile-touch-controls.md).

---

## `src/camera`

**Responsibility**: Third-person follow camera (`followCamera.js`).

**Boundaries**: Reads vehicle transform; does not affect gameplay.

---

## `src/ui`

**Responsibility**: On-screen player feedback — HUD (`hud.js`), per-vehicle
world-space health bars (`worldHealthBar.js`), and touch control styling
(`touchControls.css`).

**Boundaries**: Presentation only; no gameplay logic.

---

## `src/config`

**Responsibility**: `tuning.js` — the single, centrally-editable module for
all balance/tuning constants (archetype stats, ramming coefficient, weapon
stats, pickup respawn delay, drift/camera/vehicle-shape values). See
[Simplicity & YAGNI](../decisions/004-simplicity-and-yagni.md).

**Boundaries**: Data only — no behavior. Every other module reads from here
rather than hardcoding numbers.

---

## Important Constraints

- All motion MUST flow through `src/physics`/Rapier — no module sets a
  chassis transform directly (see
  [Physics-Accurate Ramming Combat](../decisions/002-physics-accurate-ramming.md)).
- Balance numbers live only in `src/config/tuning.js`, not scattered across
  `src/combat`/`src/vehicle` (see
  [Combat System](../features/combat-system.md) Design Rules).
- No module introduces a server-side dependency (see
  [Static-Site, No-Backend Architecture](../decisions/003-static-site-no-backend.md)).

---

## Related Documents

- [Locked Technology Stack](../decisions/001-locked-technology-stack.md)
- [Core Vehicle Loop](../features/core-vehicle-loop.md)
- [Combat System](../features/combat-system.md)
- [Mobile Touch Controls](../features/mobile-touch-controls.md)
