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
        "enforceMeleeThrownMinStrPenalties"
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

    /*
     * SWADE marks thrown melee weapons as melee items even when the
     * current attack is ranged. Requiring isMelee on the item lets this
     * setting cover both Fighting attacks and thrown attacks without
     * overlapping the separate pure-ranged Minimum Strength rule.
     */
    if (
      !item.system?.isMelee ||
      (!isMeleeAttack && !isRangedAttack)
    ) {
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
      label: "Minimum Strength",
      value: -shortfall
    });
  }
);
