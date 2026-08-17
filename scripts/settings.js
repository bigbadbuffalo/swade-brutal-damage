const SWP_MODULE_ID =
  "swade-weapon-properties";

function refreshWorldActors() {
  for (const actor of game.actors ?? []) {
    actor.reset();
    actor.prepareData();
    actor.render?.(false);
  }
}

Hooks.once("init", () => {
  game.settings.register(
    SWP_MODULE_ID,
    "enforceStrengthDamageLimit",
    {
      name:
        "Enforce Strength-Limited Weapon Damage",

      hint:
        "Enforces the SWADE rule that a Strength-based weapon's base damage die cannot exceed the wielder's actual Strength die. This affects damage only and does not enforce other Minimum Strength penalties.",

      scope: "world",
      config: true,
      type: Boolean,
      default: false
    }
  );

  game.settings.register(
    SWP_MODULE_ID,
    "enforceArmorMinStrPenalties",
    {
      name:
        "Enforce Armor Minimum Strength Penalties",

      hint:
        "Applies the SWADE Minimum Strength penalties from equipped armor: -1 Pace, Agility, and Agility-linked skill rolls for each die step the wearer is below an item's Minimum Strength. Penalties from multiple armor items are cumulative.",

      scope: "world",
      config: true,
      type: Boolean,
      default: false,

      onChange: () => {
        refreshWorldActors();
      }
    }
  );

  game.settings.register(
    SWP_MODULE_ID,
    "enforceRangedMinStrPenalties",
    {
      name:
        "Enforce Ranged Weapon Minimum Strength Penalties",

      hint:
        "Applies a -1 attack penalty for each die step the wielder is below a ranged weapon's Minimum Strength. Melee and thrown weapons are excluded.",

      scope: "world",
      config: true,
      type: Boolean,
      default: false
    }
  );

  game.settings.register(
    SWP_MODULE_ID,
    "enforceMeleeThrownMinStrPenalties",
    {
      name:
        "Enforce Melee & Thrown Weapon Minimum Strength Penalties",

      hint:
        "Applies the optional house rule that melee and thrown weapon attacks suffer -1 for each die step the wielder is below the weapon's Minimum Strength. Pure ranged weapons are controlled by the separate ranged Minimum Strength setting.",

      scope: "world",
      config: true,
      type: Boolean,
      default: false
    }
  );

  /*
   * Internal world setting used to show important module documentation
   * once per welcome-message revision without spamming chat on every load.
   */
  game.settings.register(
    SWP_MODULE_ID,
    "welcomeMessageVersion",
    {
      scope: "world",
      config: false,
      type: Number,
      default: 0
    }
  );
});
