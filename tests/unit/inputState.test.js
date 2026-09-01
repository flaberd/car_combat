import { describe, expect, it } from "vitest";
import { mapKeysToInputState } from "../../src/input/inputState.js";

describe("mapKeysToInputState", () => {
  it("returns zero axes and false flags when no keys are held", () => {
    const { inputState } = mapKeysToInputState(new Set());

    expect(inputState.moveAxis).toEqual({ x: 0, y: 0 });
    expect(inputState.aimAxis).toEqual({ x: 0, y: 0 });
    expect(inputState.drift).toBe(false);
    expect(inputState.turbo).toBe(false);
  });

  it("maps forward/backward keys to moveAxis.y", () => {
    expect(
      mapKeysToInputState(new Set(["KeyW"])).inputState.moveAxis.y,
    ).toBe(1);
    expect(
      mapKeysToInputState(new Set(["KeyS"])).inputState.moveAxis.y,
    ).toBe(-1);
    expect(
      mapKeysToInputState(new Set(["ArrowUp"])).inputState.moveAxis.y,
    ).toBe(1);
  });

  it("maps steering keys to moveAxis.x", () => {
    expect(
      mapKeysToInputState(new Set(["KeyA"])).inputState.moveAxis.x,
    ).toBe(-1);
    expect(
      mapKeysToInputState(new Set(["KeyD"])).inputState.moveAxis.x,
    ).toBe(1);
  });

  it("cancels out opposite inputs held simultaneously", () => {
    const { inputState } = mapKeysToInputState(
      new Set(["KeyW", "KeyS", "KeyA", "KeyD"]),
    );
    expect(inputState.moveAxis).toEqual({ x: 0, y: 0 });
  });

  it("reports drift as held while the drift key is down", () => {
    expect(
      mapKeysToInputState(new Set(["Space"])).inputState.drift,
    ).toBe(true);
    expect(mapKeysToInputState(new Set()).inputState.drift).toBe(false);
  });

  it("reports turbo as held while the turbo key is down (live, not edge-triggered)", () => {
    expect(
      mapKeysToInputState(new Set(["ShiftLeft"])).inputState.turbo,
    ).toBe(true);
    expect(
      mapKeysToInputState(new Set(["ShiftRight"])).inputState.turbo,
    ).toBe(true);
    expect(mapKeysToInputState(new Set()).inputState.turbo).toBe(false);

    // Still true on a second read while held, unlike an edge-triggered field.
    const first = mapKeysToInputState(new Set(["ShiftLeft"]));
    const second = mapKeysToInputState(
      new Set(["ShiftLeft"]),
      first.edgeKeysDown,
    );
    expect(second.inputState.turbo).toBe(true);
  });

  it("edge-triggers weapon switching independently of turbo's live state", () => {
    const first = mapKeysToInputState(new Set(["KeyQ", "ShiftLeft"]));
    expect(first.inputState.switchWeaponPrev).toBe(true);
    expect(first.inputState.switchWeaponNext).toBe(false);
    expect(first.inputState.turbo).toBe(true);

    // Holding KeyQ down doesn't keep re-triggering switchWeaponPrev, but
    // turbo (live, not edge-triggered) stays true the whole time it's held.
    const second = mapKeysToInputState(
      new Set(["KeyQ", "ShiftLeft"]),
      first.edgeKeysDown,
    );
    expect(second.inputState.switchWeaponPrev).toBe(false);
    expect(second.inputState.turbo).toBe(true);

    const nextPressed = mapKeysToInputState(
      new Set(["KeyR"]),
      second.edgeKeysDown,
    );
    expect(nextPressed.inputState.switchWeaponNext).toBe(true);
    expect(nextPressed.inputState.switchWeaponPrev).toBe(false);
  });
});
