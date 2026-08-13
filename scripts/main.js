console.log("%cSWADE Brutal Damage | Module loaded successfully", "color: lime; font-weight: bold; font-size: 14px");

Hooks.once("init", () => {
  console.log("%cSWADE Brutal Damage | init", "color: lime");
});

Hooks.once("ready", () => {
  console.log("%cSWADE Brutal Damage | ready – watching for damage rolls", "color: lime");

  // Make sure DamageRoll exists before we touch it
  const DamageRoll = CONFIG.Dice?.DamageRoll;
  if (!DamageRoll) {
    console.warn("SWADE Brutal Damage | DamageRoll class not found");
    return;
  }

  // Remember the original evaluate function
  const originalEvaluate = DamageRoll.prototype.evaluate;

  // Replace it with our version
  DamageRoll.prototype.evaluate = async function (...args) {
    // If this roll was marked as "brutal", force rr1 onto EVERY die
    if (this.options?.brutal) {
      for (const term of this.terms) {
        if (term instanceof foundry.dice.terms.Die) {
          // Remove any existing r1 / rr1 so we don't stack them
          term.modifiers = term.modifiers.filter(m => m !== "rr1" && m !== "r1");
          term.modifiers.push("rr1");
        }
      }
      // Make the formula match the new modifiers
      this.resetFormula();
    }

    // Call the original evaluate function
    return originalEvaluate.apply(this, args);
  };
});

Hooks.on("swadeRollDamage", (actor, item, roll, modifiers, options) => {
  const hasBrutal =
    actor?.getFlag("swade-brutal-damage", "brutal") ||
    item?.getFlag("swade-brutal-damage", "brutal");

  if (!hasBrutal || !roll?.terms) return;

  // Mark this roll so the evaluate patch knows it should apply Brutal
  roll.options = roll.options || {};
  roll.options.brutal = true;

  // Also apply rr1 to the base dice right now (so the dialog preview looks correct)
  let count = 0;
  for (const term of roll.terms) {
    if (term instanceof foundry.dice.terms.Die) {
      term.modifiers = term.modifiers.filter(m => m !== "rr1" && m !== "r1");
      term.modifiers.push("rr1");
      count++;
    }
  }

  if (count > 0) {
    console.log(
      `%cSWADE Brutal Damage | marked roll as brutal + applied rr1 to ${count} base die/dice`,
      "color: lime; font-weight: bold"
    );
  }
});
