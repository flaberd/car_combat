import { describe, expect, it } from "vitest";
import { createTurboState, updateTurboState } from "../../src/vehicle/turbo.js";
import { TURBO } from "../../src/config/tuning.js";

describe("TurboState", () => {
  it("starts ready", () => {
    expect(createTurboState().status).toBe("ready");
  });

  it("transitions ready -> boosting when pressed", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1);
    expect(turbo.status).toBe("boosting");
  });

  it("ignores press while not ready (no reactivation mid-boost)", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1); // -> boosting
    updateTurboState(turbo, true, 0.1); // still boosting, press ignored
    expect(turbo.status).toBe("boosting");
  });

  it("transitions boosting -> cooling_down once boost duration elapses", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1); // -> boosting
    updateTurboState(turbo, false, TURBO.boostDuration);
    expect(turbo.status).toBe("cooling_down");
  });

  it("stays cooling_down even if turbo is pressed again", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1); // -> boosting
    updateTurboState(turbo, false, TURBO.boostDuration); // -> cooling_down
    updateTurboState(turbo, true, 0.1); // press ignored, still cooling down
    expect(turbo.status).toBe("cooling_down");
  });

  it("transitions cooling_down -> ready once cooldown elapses", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1); // -> boosting
    updateTurboState(turbo, false, TURBO.boostDuration); // -> cooling_down
    updateTurboState(turbo, false, TURBO.cooldownDuration); // -> ready
    expect(turbo.status).toBe("ready");
  });

  it("can be reactivated once back to ready", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1);
    updateTurboState(turbo, false, TURBO.boostDuration);
    updateTurboState(turbo, false, TURBO.cooldownDuration);
    updateTurboState(turbo, true, 0.1);
    expect(turbo.status).toBe("boosting");
  });
});
