import {
  SWP_MODULE_ID,
  getMinimumStrengthShortfall
} from "./helpers/minimum-strength.js";

Hooks.on(
  "swadeCalculateDefaultAttackMods",
  (
    sourceToken,
    targetToken,
    skill,
    item,
    isRangedAttack,
    isMeleeAttack,
    additionalMods,
    bestNonStackingMods
  ) => {
    if (
      !game.settings.get(
        SWP_MODULE_ID,
        "enforceRangedMinStrPenalties"
      )
    ) {
      return;
    }

    if (
      !item ||
      item.type !== "weapon"
    ) {
      return;
    }

    if (!isRangedAttack) {
      return;
    }

    /*
     * Mixed melee/ranged weapons are generally thrown weapons.
     * RAW places those under the melee/thrown Minimum Strength rule,
     * not the ranged weapon attack-penalty rule.
     */
    if (item.system?.isMelee) {
      return;
    }

    const actor =
      item.actor ??
      sourceToken?.actor;

    if (!actor) {
      return;
    }

    const shortfall =
      getMinimumStrengthShortfall(
        actor,
        item
      );

    if (shortfall <= 0) {
      return;
    }

    additionalMods.push({
      label: "Minimum Strength (Weapon)",
      value: -shortfall
    });
  }
);
