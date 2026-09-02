import { describe, expect, it, vi } from "vitest";
import { applyTractionState, computeTractionState } from "../../src/vehicle/drift.js";
import { DRIFT } from "../../src/config/tuning.js";

function makeFakeController() {
  return {
    setWheelSideFrictionStiffness: vi.fn(),
  };
}

describe("computeTractionState", () => {
  it("drifts only when the input is held AND above the minimum speed", () => {
    expect(computeTractionState(true, DRIFT.minSpeedForEffect)).toBe(
      "drifting",
    );
    expect(computeTractionState(true, DRIFT.minSpeedForEffect - 0.1)).toBe(
      "normal",
    );
    expect(computeTractionState(false, 100)).toBe("normal");
  });
});

describe("applyTractionState", () => {
  it("uses the drift side-friction value while drifting", () => {
    const controller = makeFakeController();
    applyTractionState(controller, 4, "drifting");
    expect(controller.setWheelSideFrictionStiffness).toHaveBeenCalledTimes(4);
    expect(controller.setWheelSideFrictionStiffness).toHaveBeenLastCalledWith(
      3,
      DRIFT.driftSideFriction,
    );
  });

  it("uses the normal side-friction value otherwise", () => {
    const controller = makeFakeController();
    applyTractionState(controller, 4, "normal");
    expect(controller.setWheelSideFrictionStiffness).toHaveBeenLastCalledWith(
      3,
      DRIFT.normalSideFriction,
    );
  });

  it("scales side friction by an extra multiplier (oil slick)", () => {
    const controller = makeFakeController();
    applyTractionState(controller, 4, "normal", 0.3);
    expect(controller.setWheelSideFrictionStiffness).toHaveBeenLastCalledWith(
      3,
      DRIFT.normalSideFriction * 0.3,
    );
  });
});
