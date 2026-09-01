import { describe, expect, it, vi } from "vitest";
import {
  tryFireMachineGun,
  updateMachineGunCooldown,
} from "../../src/combat/machineGun.js";
import { WEAPONS } from "../../src/config/tuning.js";

function makeFakeVehicle(overrides = {}) {
  return {
    eliminated: false,
    machineGunCooldownRemaining: 0,
    chassisBody: {
      translation: () => ({ x: 0, y: 0, z: 0 }),
    },
    mesh: { quaternion: { x: 0, y: 0, z: 0, w: 1 } },
    ...overrides,
  };
}

function makeFakeWorld(hitResult = null) {
  return { castRay: vi.fn(() => hitResult) };
}

function makeFakeScene() {
  return { add: vi.fn(), remove: vi.fn() };
}

describe("updateMachineGunCooldown", () => {
  it("counts down toward zero and clamps at zero", () => {
    const vehicle = makeFakeVehicle({ machineGunCooldownRemaining: 0.05 });
    updateMachineGunCooldown(vehicle, 0.1);
    expect(vehicle.machineGunCooldownRemaining).toBe(0);
  });

  it("decrements by dt while above zero", () => {
    const vehicle = makeFakeVehicle({ machineGunCooldownRemaining: 0.5 });
    updateMachineGunCooldown(vehicle, 0.1);
    expect(vehicle.machineGunCooldownRemaining).toBeCloseTo(0.4);
  });
});

describe("tryFireMachineGun", () => {
  it("does nothing when not firing", () => {
    const world = makeFakeWorld();
    const scene = makeFakeScene();
    const vehicle = makeFakeVehicle();
    const tracers = [];
    tryFireMachineGun(world, scene, vehicle, false, tracers);
    expect(world.castRay).not.toHaveBeenCalled();
    expect(tracers).toHaveLength(0);
  });

  it("does nothing while eliminated", () => {
    const world = makeFakeWorld();
    const scene = makeFakeScene();
    const vehicle = makeFakeVehicle({ eliminated: true });
    const tracers = [];
    tryFireMachineGun(world, scene, vehicle, true, tracers);
    expect(world.castRay).not.toHaveBeenCalled();
    expect(tracers).toHaveLength(0);
  });

  it("does nothing while on cooldown", () => {
    const world = makeFakeWorld();
    const scene = makeFakeScene();
    const vehicle = makeFakeVehicle({ machineGunCooldownRemaining: 0.1 });
    const tracers = [];
    tryFireMachineGun(world, scene, vehicle, true, tracers);
    expect(world.castRay).not.toHaveBeenCalled();
    expect(tracers).toHaveLength(0);
  });

  it("fires and sets cooldown to 1/fireRate when available", () => {
    const world = makeFakeWorld(null); // no hit
    const scene = makeFakeScene();
    const vehicle = makeFakeVehicle();
    const tracers = [];
    tryFireMachineGun(world, scene, vehicle, true, tracers);
    expect(world.castRay).toHaveBeenCalledOnce();
    expect(vehicle.machineGunCooldownRemaining).toBeCloseTo(
      1 / WEAPONS.machineGun.fireRate,
    );
  });

  it("spawns a visible tracer on every shot, hit or miss", () => {
    const world = makeFakeWorld(null); // no hit
    const scene = makeFakeScene();
    const vehicle = makeFakeVehicle();
    const tracers = [];
    tryFireMachineGun(world, scene, vehicle, true, tracers);
    expect(scene.add).toHaveBeenCalledOnce();
    expect(tracers).toHaveLength(1);
    expect(tracers[0].dead).toBe(false);
  });
});
