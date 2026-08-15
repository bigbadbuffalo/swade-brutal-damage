const SWP_MODULE_ID = "swade-weapon-properties";

Hooks.once("init", () => {
  game.settings.register(
    SWP_MODULE_ID,
    "enforceStrengthDamageLimit",
    {
      name: "Enforce Strength-Limited Weapon Damage",
      hint:
        "Enforces the SWADE rule that a Strength-based weapon's base damage die cannot exceed the wielder's Strength die. This affects damage only and does not enforce other Minimum Strength penalties.",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    }
  );
});
