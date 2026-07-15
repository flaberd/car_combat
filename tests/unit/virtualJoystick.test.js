import { describe, expect, it } from "vitest";
import { computeJoystickAxis } from "../../src/input/virtualJoystick.js";

describe("computeJoystickAxis", () => {
  it("returns {0,0} for no drag", () => {
    expect(computeJoystickAxis(0, 0, 44)).toEqual({ x: 0, y: 0 });
  });

  it("maps a rightward drag to positive x, zero y", () => {
    const { x, y } = computeJoystickAxis(22, 0, 44);
    expect(x).toBeCloseTo(0.5);
    expect(y).toBeCloseTo(0);
  });

  it("maps an upward (screen -y) drag to positive y, matching InputState convention", () => {
    const { x, y } = computeJoystickAxis(0, -22, 44);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0.5);
  });

  it("maps a downward (screen +y) drag to negative y", () => {
    const { y } = computeJoystickAxis(0, 22, 44);
    expect(y).toBeCloseTo(-0.5);
  });

  it("clamps drag distance beyond maxRadius to 1.0 magnitude", () => {
    const { x, y } = computeJoystickAxis(200, 0, 44);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
    expect(Math.hypot(x, y)).toBeCloseTo(1);
  });

  it("preserves direction for a diagonal drag beyond maxRadius", () => {
    const { x, y } = computeJoystickAxis(100, -100, 44);
    expect(Math.hypot(x, y)).toBeCloseTo(1);
    expect(x).toBeCloseTo(y); // 45-degree drag stays 45 degrees
  });

  it("returns {0,0} when maxRadius is zero (degenerate guard)", () => {
    expect(computeJoystickAxis(10, 10, 0)).toEqual({ x: 0, y: 0 });
  });
});
