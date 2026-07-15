import { describe, expect, it } from "vitest";
import { mapKeysToInputState } from "../../src/input/inputState.js";

describe("mapKeysToInputState", () => {
  it("returns zero axes and false flags when no keys are held", () => {
    const { inputState } = mapKeysToInputState(new Set(), false);

    expect(inputState.moveAxis).toEqual({ x: 0, y: 0 });
    expect(inputState.aimAxis).toEqual({ x: 0, y: 0 });
    expect(inputState.drift).toBe(false);
    expect(inputState.turbo).toBe(false);
  });

  it("maps forward/backward keys to moveAxis.y", () => {
    expect(
      mapKeysToInputState(new Set(["KeyW"]), false).inputState.moveAxis.y,
    ).toBe(1);
    expect(
      mapKeysToInputState(new Set(["KeyS"]), false).inputState.moveAxis.y,
    ).toBe(-1);
    expect(
      mapKeysToInputState(new Set(["ArrowUp"]), false).inputState.moveAxis.y,
    ).toBe(1);
  });

  it("maps steering keys to moveAxis.x", () => {
    expect(
      mapKeysToInputState(new Set(["KeyA"]), false).inputState.moveAxis.x,
    ).toBe(-1);
    expect(
      mapKeysToInputState(new Set(["KeyD"]), false).inputState.moveAxis.x,
    ).toBe(1);
  });

  it("cancels out opposite inputs held simultaneously", () => {
    const { inputState } = mapKeysToInputState(
      new Set(["KeyW", "KeyS", "KeyA", "KeyD"]),
      false,
    );
    expect(inputState.moveAxis).toEqual({ x: 0, y: 0 });
  });

  it("reports drift as held while the drift key is down", () => {
    expect(
      mapKeysToInputState(new Set(["Space"]), false).inputState.drift,
    ).toBe(true);
    expect(mapKeysToInputState(new Set(), false).inputState.drift).toBe(
      false,
    );
  });

  it("edge-triggers turbo only on the up-to-down transition", () => {
    const first = mapKeysToInputState(new Set(["ShiftLeft"]), false);
    expect(first.inputState.turbo).toBe(true);
    expect(first.turboKeyDown).toBe(true);

    const second = mapKeysToInputState(
      new Set(["ShiftLeft"]),
      first.turboKeyDown,
    );
    expect(second.inputState.turbo).toBe(false);
    expect(second.turboKeyDown).toBe(true);

    const released = mapKeysToInputState(new Set(), second.turboKeyDown);
    expect(released.inputState.turbo).toBe(false);
    expect(released.turboKeyDown).toBe(false);

    const pressedAgain = mapKeysToInputState(
      new Set(["ShiftRight"]),
      released.turboKeyDown,
    );
    expect(pressedAgain.inputState.turbo).toBe(true);
  });
});
