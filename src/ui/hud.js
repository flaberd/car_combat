const WEAPON_LABELS = {
  rockets: "Rockets",
  homingRockets: "Homing Rockets",
  mines: "Mines",
  oilSlick: "Oil Slick",
};

const LOW_HP_RATIO = 0.5;
const CRITICAL_HP_RATIO = 0.25;

/**
 * Player HUD: HP bar/text, the currently selected pickup weapon's name +
 * remaining ammo. For targeting-capable weapons (currently just homing
 * rockets — src/combat/targeting.js), also shows whether a target is
 * currently locked, since that's what determines whether tapping Use will
 * actually fire — the 3D marker over the target is the primary feedback,
 * this is a textual backup. The machine gun isn't shown here — it has
 * unlimited ammo and needs no pickup.
 */
export function createHud(document) {
  const rootEl = document.getElementById("hud");
  const hpFillEl = document.getElementById("hud-hp-fill");
  const hpTextEl = document.getElementById("hud-hp-text");
  const weaponTextEl = document.getElementById("hud-weapon-text");

  function show() {
    rootEl.classList.remove("hidden");
  }

  function update(vehicle) {
    const maxHp = vehicle.archetype.maxHp;
    const hp = Math.max(0, vehicle.hp);
    const hpRatio = maxHp > 0 ? hp / maxHp : 0;

    hpFillEl.style.width = `${hpRatio * 100}%`;
    hpFillEl.classList.toggle("critical", hpRatio <= CRITICAL_HP_RATIO);
    hpFillEl.classList.toggle(
      "low",
      hpRatio > CRITICAL_HP_RATIO && hpRatio <= LOW_HP_RATIO,
    );
    hpTextEl.textContent = `${Math.round(hp)} / ${maxHp}`;

    const slot = vehicle.weaponSlots[vehicle.selectedWeaponIndex];
    if (!slot) {
      weaponTextEl.textContent = "No weapon";
      return;
    }

    const targetHint =
      slot.type === "homingRockets"
        ? vehicle.activeTarget
          ? " (target locked)"
          : " (no target)"
        : "";
    weaponTextEl.textContent = `${WEAPON_LABELS[slot.type]}: ${slot.ammo}${targetHint}`;
  }

  return { show, update };
}
