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
  for (const term of roll.terms) {
    if (term instanceof foundry.dice.terms.Die) {
      term.modifiers = term.modifiers.filter(m => m !== "rr1" && m !== "r1");
      term.modifiers.push("rr1");
      count++;
    }
  }

  if (count > 0) {
    console.log(`%cSWADE Brutal Damage | rr1 applied to ${count} dice`, "color: lime; font-weight: bold");
  }
});