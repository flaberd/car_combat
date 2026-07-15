const WEAPON_LABELS = {
  rockets: "Rockets",
  homingRockets: "Homing Rockets",
  mines: "Mines",
  oilSlick: "Oil Slick",
};

const LOW_HP_RATIO = 0.5;
const CRITICAL_HP_RATIO = 0.25;

/**
 * Player HUD: HP bar/text and the currently selected pickup weapon's name
 * + remaining ammo. The machine gun isn't shown here — it has unlimited
 * ammo and is always available (spec.md FR-003), so there's nothing to
 * track for it.
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
    weaponTextEl.textContent = slot
      ? `${WEAPON_LABELS[slot.type]}: ${slot.ammo}`
      : "No weapon";
  }

  return { show, update };
}
