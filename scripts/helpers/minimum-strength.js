export const SWP_MODULE_ID = "swade-weapon-properties";

/**
 * Convert a SWADE Trait die into a numeric die-step value.
 *
 * Examples:
 * d4-1  = -1
 * d4    =  0
 * d6    =  1
 * d8    =  2
 * d10   =  3
 * d12   =  4
 * d12+1 =  5
 * d12+2 =  6
 */
export function traitDieToSteps(die) {
  if (!die) return null;

  const sides = Number(die.sides);
  const modifier = Number(die.modifier ?? 0);

  if (!Number.isFinite(sides)) {
    return null;
  }

  return ((sides - 4) / 2) + modifier;
}

/**
 * Parse a Minimum Strength value into die steps.
 *
 * Supported examples:
 * 4
 * 6
 * "d6"
 * "d12+1"
 * "d4-1"
 * { sides: 8, modifier: 0 }
 *
 * "NA", "-", blank, and null are treated as no Minimum Strength.
 */
export function minimumStrengthToSteps(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "object") {
    const sides = Number(
      value.sides ??
      value.die ??
      value.value
    );

    const modifier = Number(
      value.modifier ??
      value.mod ??
      0
    );

    if (!Number.isFinite(sides)) {
      return null;
    }

    return traitDieToSteps({
      sides,
      modifier
    });
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    return traitDieToSteps({
      sides: value,
      modifier: 0
    });
  }

  const text = String(value)
    .trim()
    .toLowerCase();

  if (
    !text ||
    text === "na" ||
    text === "n/a" ||
    text === "-"
  ) {
    return null;
  }

  const match = text.match(
    /^d?(\d+)(?:\s*([+-])\s*(\d+))?$/
  );

  if (!match) {
    return null;
  }

  const sides = Number(match[1]);
  let modifier = 0;

  if (match[2] && match[3]) {
    modifier = Number(match[3]);

    if (match[2] === "-") {
      modifier *= -1;
    }
  }

  return traitDieToSteps({
    sides,
    modifier
  });
}

/**
 * Return the actor's actual Strength in die steps.
 *
 * This is NOT adjusted for Brawny, Soldier, or our Min Str flag.
 */
export function getActualStrengthSteps(actor) {
  const die =
    actor?.system?.attributes?.strength?.die;

  return traitDieToSteps(die);
}

/**
 * Return the actor's module-defined Minimum Strength adjustment.
 *
 * Active Effect:
 * flags.swade-weapon-properties.minStrBonus
 * Add
 * 1
 *
 * represents one die type higher for Minimum Strength purposes.
 */
export function getMinimumStrengthBonus(actor) {
  const value = Number(
    actor?.getFlag(
      SWP_MODULE_ID,
      "minStrBonus"
    ) ?? 0
  );

  if (!Number.isFinite(value)) {
    return 0;
  }

  return value;
}

/**
 * Return the actor's effective Strength for Minimum Strength
 * requirements.
 *
 * This does NOT change actual Strength.
 */
export function getEffectiveMinimumStrengthSteps(actor) {
  const actual =
    getActualStrengthSteps(actor);

  if (actual === null) {
    return null;
  }

  return actual +
    getMinimumStrengthBonus(actor);
}

/**
 * Return an item's Minimum Strength in die steps.
 */
export function getItemMinimumStrengthSteps(item) {
  if (!item) return null;

  return minimumStrengthToSteps(
    item.system?.minStr
  );
}

/**
 * Return how many die steps the actor is below this item's
 * Minimum Strength.
 *
 * 0 means the requirement is met.
 */
export function getMinimumStrengthShortfall(
  actor,
  item
) {
  const effectiveStrength =
    getEffectiveMinimumStrengthSteps(actor);

  const minimumStrength =
    getItemMinimumStrengthSteps(item);

  if (
    effectiveStrength === null ||
    minimumStrength === null
  ) {
    return 0;
  }

  return Math.max(
    0,
    minimumStrength - effectiveStrength
  );
}
