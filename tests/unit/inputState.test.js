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

  it("edge-triggers turbo only on the up-to-down transition", () => {
    const first = mapKeysToInputState(new Set(["ShiftLeft"]));
    expect(first.inputState.turbo).toBe(true);
    expect(first.edgeKeysDown.turbo).toBe(true);

    const second = mapKeysToInputState(
      new Set(["ShiftLeft"]),
      first.edgeKeysDown,
    );
    expect(second.inputState.turbo).toBe(false);
    expect(second.edgeKeysDown.turbo).toBe(true);

    const released = mapKeysToInputState(new Set(), second.edgeKeysDown);
    expect(released.inputState.turbo).toBe(false);
    expect(released.edgeKeysDown.turbo).toBe(false);

    const pressedAgain = mapKeysToInputState(
      new Set(["ShiftRight"]),
      released.edgeKeysDown,
    );
    expect(pressedAgain.inputState.turbo).toBe(true);
  });

  it("edge-triggers weapon switching independently of turbo", () => {
    const first = mapKeysToInputState(new Set(["KeyQ", "ShiftLeft"]));
    expect(first.inputState.switchWeaponPrev).toBe(true);
    expect(first.inputState.switchWeaponNext).toBe(false);
    expect(first.inputState.turbo).toBe(true);

    // Holding KeyQ down doesn't keep re-triggering switchWeaponPrev.
    const second = mapKeysToInputState(
      new Set(["KeyQ", "ShiftLeft"]),
      first.edgeKeysDown,
    );
    expect(second.inputState.switchWeaponPrev).toBe(false);

    const nextPressed = mapKeysToInputState(
      new Set(["KeyR"]),
      second.edgeKeysDown,
    );
    expect(nextPressed.inputState.switchWeaponNext).toBe(true);
    expect(nextPressed.inputState.switchWeaponPrev).toBe(false);
  });
});
