const SWP_MODULE_ID = "swade-weapon-properties";

Hooks.once("init", () => {
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
