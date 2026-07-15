import { describe, expect, it } from "vitest";
import {
  decideInitialMode,
  decideOverride,
} from "../../src/input/inputController.js";

describe("decideInitialMode", () => {
  it("picks touch when the primary pointer is coarse and hover is unavailable", () => {
    expect(decideInitialMode(true)).toBe("touch");
  });

  it("picks keyboard otherwise", () => {
    expect(decideInitialMode(false)).toBe("keyboard");
  });
});

describe("decideOverride", () => {
  it("switches keyboard -> touch on a real touch pointerdown", () => {
    const next = decideOverride("keyboard", {
      type: "pointerdown",
      pointerType: "touch",
    });
    expect(next).toBe("touch");
  });

  it("does NOT switch keyboard -> touch on a mouse pointerdown", () => {
    const next = decideOverride("keyboard", {
      type: "pointerdown",
      pointerType: "mouse",
    });
    expect(next).toBe("keyboard");
  });

  it("switches touch -> keyboard on a bound keydown", () => {
    const next = decideOverride("touch", { type: "keydown", code: "KeyW" });
    expect(next).toBe("keyboard");
  });

  it("does NOT switch touch -> keyboard on an unbound keydown", () => {
    const next = decideOverride("touch", { type: "keydown", code: "KeyZ" });
    expect(next).toBe("touch");
  });

  it("is a no-op when already in the target mode", () => {
    expect(
      decideOverride("touch", { type: "pointerdown", pointerType: "touch" }),
    ).toBe("touch");
    expect(
      decideOverride("keyboard", { type: "keydown", code: "KeyW" }),
    ).toBe("keyboard");
  });
});
