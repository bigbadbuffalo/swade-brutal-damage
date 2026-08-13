console.log("%cSWADE Brutal Damage | Module loaded successfully", "color: lime; font-weight: bold; font-size: 14px");

Hooks.once("init", () => {
  console.log("%cSWADE Brutal Damage | init", "color: lime");
});

Hooks.once("ready", () => {
  console.log("%cSWADE Brutal Damage | ready – watching for damage rolls", "color: lime");

  const DamageRoll = CONFIG.Dice?.DamageRoll;
  if (!DamageRoll) {
    console.warn("SWADE Brutal Damage | DamageRoll class not found – cannot patch");
    return;
  }

  const originalEvaluate = DamageRoll.prototype.evaluate;

  DamageRoll.prototype.evaluate = async function (...args) {
    // Look at the current dice. If ANY of them already have rr1,
    // force rr1 onto EVERY die (this catches the Raise die).
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
      let changed = 0;
      for (const term of this.terms) {
        if (term instanceof foundry.dice.terms.Die) {
          const before = term.modifiers.join(",");
          term.modifiers = term.modifiers.filter(m => m !== "rr1" && m !== "r1");
          term.modifiers.push("rr1");
          if (term.modifiers.join(",") !== before) changed++;
        }
      }
      if (changed > 0) {
        this.resetFormula();
        console.log(`%cSWADE Brutal Damage | forced rr1 onto ${changed} additional die/dice (Raise etc.)`, "color: lime; font-weight: bold");
      }
    }

    return originalEvaluate.apply(this, args);
  };
});

Hooks.on("swadeRollDamage", (actor, item, roll, modifiers, options) => {
  const hasBrutal =
    actor?.getFlag("swade-brutal-damage", "brutal") ||
    item?.getFlag("swade-brutal-damage", "brutal");

  if (!hasBrutal || !roll?.terms) return;

  // Put rr1 on the base dice so the dialog preview is correct
  // and so the evaluate patch later knows this is a Brutal roll
  let count = 0;
  for (const term of roll.terms) {
    if (term instanceof foundry.dice.terms.Die) {
      term.modifiers = term.modifiers.filter(m => m !== "rr1" && m !== "r1");
      term.modifiers.push("rr1");
      count++;
    }
  }

  if (count > 0) {
    console.log(`%cSWADE Brutal Damage | applied rr1 to ${count} base die/dice`, "color: lime; font-weight: bold");
  }
});
