// colliderHandle -> vehicle lookup (specs/002-combat-system/plan.md
// Foundational). Collision events from Rapier's EventQueue only carry
// collider handles, so combat systems (ramming, pickups, mines, oil slick)
// resolve them back to Vehicle objects here rather than each maintaining
// their own map.

const vehiclesByColliderHandle = new Map();

export function registerVehicle(vehicle) {
  vehiclesByColliderHandle.set(vehicle.chassisCollider.handle, vehicle);
}

export function unregisterVehicle(vehicle) {
  vehiclesByColliderHandle.delete(vehicle.chassisCollider.handle);
}

export function getVehicleByColliderHandle(handle) {
  return vehiclesByColliderHandle.get(handle) ?? null;
}
