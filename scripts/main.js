console.log("%cSWADE Brutal Damage | Module loaded successfully", "color: lime; font-weight: bold; font-size: 14px");

Hooks.once("init", () => {
  console.log("%cSWADE Brutal Damage | init", "color: lime");
});

Hooks.once("ready", () => {
  console.log("%cSWADE Brutal Damage | ready – watching for damage rolls", "color: lime");
});

Hooks.on("swadeRollDamage", (actor, item, roll, modifiers, options) => {
  const hasBrutal =
    actor?.getFlag("swade-brutal-damage", "brutal") ||
    item?.getFlag("swade-brutal-damage", "brutal");

  if (!hasBrutal || !roll?.terms) return;

  let count = 0;

  // 1. Base damage dice (Strength + weapon die, etc.)
  for (const term of roll.terms) {
    if (term instanceof foundry.dice.terms.Die) {
      // Clean out any old r1/rr1 so we don't stack them
      term.modifiers = term.modifiers.filter(m => m !== "rr1" && m !== "r1");
      term.modifiers.push("rr1");
      count++;
    }
  }

  // 2. Any existing modifiers that are already dice expressions
  for (const mod of modifiers) {
    if (typeof mod.value === "string" && /\d+d\d+/.test(mod.value) && !/rr?1/.test(mod.value)) {
      mod.value = mod.value.replace(/(\d+d\d+)/g, "$1rr1");
    }
  }

  // 3. Raise / bonus damage die
  //    The system later builds: +1d6x (or whatever the raise die is)
  //    By adding "rr1" to the die type we get +1d6rr1x, which works correctly.
  if (item && "bonusDamageDie" in item.system) {
    const dieType = String(item.system.bonusDamageDie ?? "6");
    if (!/rr?1/.test(dieType)) {
      // Temporary in-memory change only – does not save to the database
      item.system.bonusDamageDie = dieType + "rr1";
    }
  }

  if (count > 0) {
    console.log(
      `%cSWADE Brutal Damage | rr1 applied to ${count} base die/dice (+ raise if used)`,
      "color: lime; font-weight: bold"
    );
  }
});
