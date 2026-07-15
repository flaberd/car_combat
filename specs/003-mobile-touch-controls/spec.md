# Feature Specification: Mobile Touch Controls & Input Auto-Detection

**Feature Branch**: `003-mobile-touch-controls`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "Mobile Touch Controls & Input Auto-Detection — extends 001-core-vehicle-loop's control layer. The game must be playable from a phone browser in addition to desktop keyboard, with the correct control scheme enabled automatically (no manual toggle). Touch controls reuse the existing twin-stick InputState abstraction: left virtual joystick drives moveAxis, right virtual joystick is present but unbound (reserved for future aim/fire), on-screen Drift and Turbo buttons map to InputState.drift/turbo. Mobile play is landscape-only — portrait on a touch device blocks gameplay with a rotate-device prompt until rotated back. Desktop/keyboard behavior must be completely unaffected. Out of scope: gamepad, native app packaging (Capacitor), combat/aim behavior, manual settings toggle."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Control Scheme Detection (Priority: P1)

As a player, I want the game to automatically show me the right controls for my device so that I can start playing immediately without hunting for a settings menu.

**Why this priority**: Without correct auto-detection, nothing else in this feature has value — a touch player shown keyboard-only controls (or vice versa) can't play at all. This is the foundation every other story depends on.

**Independent Test**: Load the game on a touch device and confirm touch controls appear with no keyboard-only UI; load it on a desktop browser and confirm no touch controls appear. Fully testable with no other story implemented (the underlying InputState already exists from 001-core-vehicle-loop).

**Acceptance Scenarios**:

1. **Given** the game is loaded on a device whose primary input is touch, **When** the page finishes loading, **Then** on-screen touch controls appear automatically, with no setting to enable them.
2. **Given** the game is loaded on a device whose primary input is keyboard/mouse, **When** the page finishes loading, **Then** no on-screen touch controls appear, matching the existing keyboard-only experience.
3. **Given** touch mode is active, **When** the player presses a keyboard movement key, **Then** the game switches to keyboard mode (see Edge Cases / Assumptions on hybrid devices).
4. **Given** keyboard mode is active, **When** the player touches the game area, **Then** the game switches to touch mode.

---

### User Story 2 - Drive and Steer via Touch (Priority: P1)

As a player on a touch device, I want an on-screen joystick to drive and steer so that I have the same core control as a keyboard player.

**Why this priority**: Drive/steer is the most basic control from 001-core-vehicle-loop; touch play isn't viable at all without it.

**Independent Test**: With touch mode active, drag the left on-screen joystick in various directions and confirm the vehicle accelerates, reverses, and steers accordingly, matching keyboard behavior for equivalent input.

**Acceptance Scenarios**:

1. **Given** touch mode is active, **When** the player drags the left virtual joystick forward, **Then** the vehicle accelerates forward, proportionally to how far the joystick is pushed.
2. **Given** touch mode is active, **When** the player drags the left virtual joystick left or right, **Then** the vehicle steers in that direction.
3. **Given** touch mode is active, **When** the player releases the left virtual joystick, **Then** it returns to center and the vehicle's throttle/steer input returns to neutral.
4. **Given** touch mode is active, **When** the game is running, **Then** a right virtual joystick is also visible and touchable but produces no gameplay effect (reserved for a future feature).

---

### User Story 3 - Drift and Turbo via Touch (Priority: P1)

As a player on a touch device, I want on-screen buttons for drift and turbo so that I have full parity with the keyboard's core control mechanics.

**Why this priority**: Drift and turbo are constitution-mandated core control mechanics (Principle VI) that must be present from the first driveable prototype — touch play is incomplete without them, same priority as touch drive/steer.

**Independent Test**: With touch mode active and the vehicle moving, press and hold the Drift button and confirm the same traction change as the keyboard's drift input; tap the Turbo button and confirm the same boost/cooldown behavior as the keyboard's turbo input.

**Acceptance Scenarios**:

1. **Given** touch mode is active and the vehicle is moving, **When** the player holds the on-screen Drift button, **Then** the vehicle enters the drifting traction state, matching keyboard Space behavior.
2. **Given** the on-screen Drift button is released, **When** this happens, **Then** the vehicle returns to normal traction, matching keyboard behavior.
3. **Given** touch mode is active and turbo is available, **When** the player taps the on-screen Turbo button, **Then** the vehicle boosts and then enters cooldown, matching keyboard Shift behavior — including that rapid repeated taps during boost/cooldown have no additional effect.

---

### User Story 4 - Landscape-Only Orientation Gate (Priority: P2)

As a player on a touch device, I want to be prompted to rotate to landscape if I'm holding my phone in portrait, so gameplay is never attempted in an unusable layout.

**Why this priority**: Important for a coherent mobile experience, but it's a gate layered on top of already-functional touch controls (Stories 1–3) — the controls must exist first before an orientation gate around them is meaningful to test.

**Independent Test**: On a touch device, rotate to portrait and confirm gameplay is blocked with a rotate prompt (no physics/input processing); rotate to landscape and confirm gameplay resumes automatically.

**Acceptance Scenarios**:

1. **Given** touch mode is active and the device is in portrait orientation, **When** this is detected, **Then** gameplay is blocked (paused) and a full-screen prompt asks the player to rotate to landscape.
2. **Given** the rotate prompt is showing, **When** the player rotates the device to landscape, **Then** the prompt disappears and gameplay resumes automatically with no further action required.
3. **Given** keyboard mode is active, **When** the browser window is narrower than it is tall, **Then** no rotate prompt appears — the orientation gate only applies to touch mode.

---

### User Story 5 - Start Gate: Fullscreen and Forced Landscape (Priority: P1)

As a player on a touch device, I want tapping a Start button to put the game into fullscreen and rotate it to landscape for me, so that I can actually play even though my phone's auto-rotate setting is off (the common case for many players, where physically rotating the phone alone never triggers User Story 4's rotate prompt to resolve — the browser viewport simply never reflows if the OS won't rotate the screen).

**Why this priority**: Without this, User Story 4's rotate-prompt gate is a dead end for any player with auto-rotate disabled at the OS level — an extremely common setting — since the underlying orientation signal it depends on never changes no matter how the player holds their phone. This isn't a nice-to-have; it's what makes touch play actually reachable for most real players.

**Independent Test**: On a touch device, load the game, see a Start button before any gameplay is visible; tap it and confirm the browser enters fullscreen and the game displays in landscape, even when the OS's rotation lock is on and the phone is physically held in portrait.

**Acceptance Scenarios**:

1. **Given** the game has just loaded, **When** the page finishes loading, **Then** a large, clearly visible Start button is shown and no gameplay (vehicle, arena, touch controls) is visible or interactive yet.
2. **Given** the Start button is showing on a touch device, **When** the player taps it, **Then** the browser requests fullscreen for the game.
3. **Given** the Start button is showing on a touch device whose browser supports programmatic orientation locking, **When** the player taps it, **Then** the display is forced to landscape regardless of the device's physical orientation or its OS-level auto-rotate setting.
4. **Given** the Start button is showing on a touch device whose browser does NOT support programmatic orientation locking (e.g., an iOS Safari–class browser), **When** the player taps it, **Then** the game still enters fullscreen and starts, falling back to User Story 4's rotate-prompt gate for orientation (the player must physically rotate with auto-rotate enabled, as before this story).
5. **Given** the Start button is showing on a desktop/keyboard device, **When** the player taps or clicks it, **Then** the game simply starts (fullscreen/orientation-lock behavior is touch-only; a keyboard player is never blocked by or required to use fullscreen).

---

### Edge Cases

- A touch-and-mouse hybrid device: a mouse click alone (no touch event) MUST NOT trigger a switch into touch mode — only an actual touch event should.
- If fullscreen or orientation-lock is requested but the browser rejects or the player later exits fullscreen (e.g., via a system back gesture), the game MUST continue to be playable rather than getting stuck — User Story 4's rotate-prompt gate remains the fallback if the display ends up portrait after such an exit.
- If the player's browser blocks the fullscreen/orientation-lock request entirely (permission denied, unsupported), the Start button MUST still start the game rather than getting stuck on a failed request.
- Device orientation changing while in keyboard mode (e.g., a foldable laptop) MUST have no effect — the orientation gate only applies in touch mode (User Story 4, Scenario 3).
- If the player is mid-drift or mid-turbo-boost when the device rotates to portrait and gameplay is blocked, the vehicle's state is preserved as-is; when gameplay resumes (rotated back to landscape) it continues from that state rather than resetting.
- If a virtual joystick's touch is released, or interrupted (e.g., by an incoming call overlay or the touch leaving the screen), the joystick MUST return to centered/neutral output rather than getting stuck at its last dragged position.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect on load whether the device's primary input is touch or keyboard/mouse, and enable the matching control scheme automatically, with no manual setting required.
- **FR-002**: When touch mode is active, System MUST render an on-screen left virtual joystick that maps its drag position to `InputState.moveAxis` (steer + throttle/reverse), replacing keyboard movement input.
- **FR-003**: When touch mode is active, System MUST render an on-screen right virtual joystick that accepts touch input but produces no bound gameplay behavior in this feature (`InputState.aimAxis` remains `{0,0}`), reserved for a future feature.
- **FR-004**: When touch mode is active, System MUST render an on-screen Drift button that sets `InputState.drift` true while pressed and false when released, matching keyboard behavior.
- **FR-005**: When touch mode is active, System MUST render an on-screen Turbo button that produces an edge-triggered `InputState.turbo` signal on press, matching keyboard behavior.
- **FR-006**: When keyboard mode is active, System MUST NOT display any on-screen touch controls or the rotate-device prompt.
- **FR-007**: While touch mode is active, System MUST continuously detect device orientation and, when portrait, MUST block gameplay (pause physics/input processing) and display a full-screen prompt to rotate to landscape.
- **FR-008**: System MUST automatically resume gameplay as soon as a touch device's orientation changes from portrait to landscape, with no player action beyond rotating the device.
- **FR-009**: System MUST switch the active input method at runtime if the player's actual behavior contradicts the initially detected mode (an actual touch event while in keyboard mode; a movement-bound keyboard key while in touch mode), so ambiguous/hybrid devices are not stuck with the wrong control scheme.
- **FR-010**: The orientation gate (FR-007) MUST NOT apply while keyboard mode is active, regardless of browser window aspect ratio.
- **FR-011**: A released or interrupted virtual joystick touch MUST return that joystick to centered/neutral output.
- **FR-012**: System MUST show a Start button before any gameplay begins, with no vehicle, arena interaction, or touch controls visible or active until it is tapped/clicked.
- **FR-013**: On touch devices, tapping the Start button MUST request fullscreen and MUST attempt to programmatically lock screen orientation to landscape; the game MUST start regardless of whether either request succeeds (Edge Cases: never block startup on a failed or unsupported request).
- **FR-014**: On devices where programmatic orientation locking is unsupported or fails, the existing landscape-only orientation gate (FR-007/FR-008) remains the fallback mechanism after Start is tapped.
- **FR-015**: On keyboard/desktop devices, tapping/clicking the Start button MUST simply start the game — fullscreen and orientation-lock requests are touch-only (FR-013 does not apply).

### Key Entities

- **Start Gate**: A pre-gameplay screen with a Start button; tracks whether the player has started the game yet. On touch devices, starting it triggers the fullscreen/orientation-lock attempt (FR-012–FR-015).
- **Input Method**: The currently active control mode (`touch` or `keyboard`), set by FR-001 and updated by FR-009.
- **Virtual Joystick**: An on-screen touch control tracking its touch origin and current drag offset, producing a normalized axis output; used for both the left (bound) and right (unbound) joysticks.
- **Touch Button** (Drift / Turbo): An on-screen tappable control tracking its pressed state, feeding `InputState.drift`/`InputState.turbo`.
- **Orientation Gate**: Tracks current device orientation while in touch mode and whether gameplay is currently blocked pending rotation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player opening the game on a phone browser sees touch controls with no settings step, and can drive/steer within 5 seconds of the device being in landscape.
- **SC-002**: A player opening the game on a desktop browser sees an experience identical to the pre-existing keyboard-only game, with no touch controls visible.
- **SC-003**: A player holding a touch device in portrait sees a rotate-to-landscape prompt instead of the game, and gameplay begins automatically within 1 second of rotating to landscape.
- **SC-004**: Touch-driven drift and turbo produce the same observable vehicle behavior as their keyboard equivalents.
- **SC-005**: A real input action that contradicts the currently active control scheme (e.g., touching the screen while in keyboard mode) results in the control scheme switching to match within a single interaction, with no page reload.
- **SC-006**: A player on a touch device with the OS auto-rotate setting turned off (physically rotating the phone has no effect on the browser viewport) can still reach a playable landscape layout by tapping Start, on any browser that supports programmatic orientation locking.

## Assumptions

- **Why a Start Gate is needed (not just User Story 4 alone)**: User Story 4's rotate-prompt gate depends on `matchMedia('(orientation: ...)')`, which only changes when the OS actually reflows the browser viewport on rotation. Many players keep their OS-level auto-rotate lock switched on (screen rotation disabled) — a very common device setting — in which case physically rotating the phone produces no viewport change at all, and User Story 4's prompt can never resolve no matter what the player does. User Story 5's Start button exists specifically to work around this: fullscreen + programmatic orientation lock, triggered from a genuine user gesture (tapping Start), can force landscape on supporting browsers regardless of the OS auto-rotate setting. Where that's unsupported (notably iOS Safari–class browsers), User Story 4 remains the fallback and still requires the player to have auto-rotate enabled — a known, accepted limitation on those browsers.

- **Touch vs. keyboard detection default**: detection uses the combination of the CSS `pointer: coarse` and `hover: none` media features to identify the device's *primary* input mechanism, not merely whether touch is supported. This correctly defaults a touchscreen laptop (whose primary pointer is typically its trackpad, reported as fine + hover-capable) to keyboard mode, and a tablet (whose primary pointer remains touch even with a paired keyboard) to touch mode — matching how most people actually hold and use each device type. FR-009's runtime override handles any remaining cases where this default doesn't match actual play behavior, without requiring a settings screen.
- "Landscape" is determined by comparing viewport width to height (or the Screen Orientation API where available) — not a hardcoded device/model list.
- No persistence of input-method or orientation state is required between sessions; detection runs fresh on each page load, consistent with 001-core-vehicle-loop's existing no-persistence assumption.
- This feature only adds a second way to produce the same `InputState` already defined by 001-core-vehicle-loop; it does not add any new vehicle behavior beyond drive/steer/drift/turbo.

## Non-Goals

- Gamepad support (still deferred per the constitution).
- Native app packaging via Capacitor (still deferred per the constitution) — this feature is browser-based touch play only.
- Any combat/aim functionality bound to the right virtual joystick (002-combat-system's concern, currently paused).
- A manual control-scheme settings/toggle UI — automatic detection is the point of this feature for MVP.
