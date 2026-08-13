Hooks.once("init", () => {
  // Module initialized
});

Hooks.once("ready", () => {
  const DamageRoll = CONFIG.Dice?.DamageRoll;
  if (!DamageRoll) return;

  const originalEvaluate = DamageRoll.prototype.evaluate;

  DamageRoll.prototype.evaluate = async function (...args) {
    // If any die already has rr1 (from the base damage), force it onto every die
    // so the Raise / bonus damage die is also covered.
    let hasBrutalDie = false;

    for (const term of this.terms) {
      if (term instanceof foundry.dice.terms.Die) {
        if (term.modifiers.includes("rr1") || term.modifiers.includes("r1")) {
          hasBrutalDie = true;
          break;
        }
      }
    }

    if (hasBrutalDie) {
      for (const term of this.terms) {
        if (term instanceof foundry.dice.terms.Die) {
          term.modifiers = term.modifiers.filter(m => m !== "rr1" && m !== "r1");
          term.modifiers.push("rr1");
        }
      }
      this.resetFormula();
    }

    return originalEvaluate.apply(this, args);
  };
});

Hooks.on("swadeRollDamage", (actor, item, roll, modifiers, options) => {
  const hasBrutal =
    actor?.getFlag("swade-brutal-damage", "brutal") ||
    item?.getFlag("swade-brutal-damage", "brutal");

  if (!hasBrutal || !roll?.terms) return;

  // Apply rr1 to the base damage dice (Strength, weapon die, etc.)
  // so the dialog preview is correct and so the evaluate patch
  // knows this is a Brutal roll.
  for (const term of roll.terms) {
    if (term instanceof foundry.dice.terms.Die) {
      term.modifiers = term.modifiers.filter(m => m !== "rr1" && m !== "r1");
      term.modifiers.push("rr1");
    }
  }
});
