const SWP_MODULE_ID = "swade-weapon-properties";
const SWP_WELCOME_VERSION = 3;
const SWP_README_URL =
  "https://github.com/bigbadbuffalo/swade-weapon-properties#readme";

Hooks.once("ready", async () => {
  if (!game.user?.isGM) return;

  const shownVersion = Number(
    game.settings.get(
      SWP_MODULE_ID,
      "welcomeMessageVersion"
    ) ?? 0
  );

  if (shownVersion >= SWP_WELCOME_VERSION) return;

  const content = `
    <div class="swade-weapon-properties-welcome">
      <h2>SWADE Weapon Properties</h2>
      <p>
        This module adds reusable custom weapon properties for SWADE.
      </p>

      <p><strong>Active Effect flags:</strong></p>
      <ul>
        <li><code>flags.swade-weapon-properties.brutal</code> — Brutal damage</li>
        <li><code>flags.swade-weapon-properties.offhand</code> — Off Hand weapon</li>
      </ul>

      <p>
        Minimum Strength automation now lives in the separate
        <strong>SWADE Minimum Strength Automation</strong> module.
      </p>

      <p>
        <a href="${SWP_README_URL}" target="_blank" rel="noopener noreferrer">
          View the README for setup instructions and examples
        </a>
      </p>
    </div>
  `;

  try {
    await ChatMessage.create({
      speaker: { alias: "SWADE Weapon Properties" },
      content
    });

    await game.settings.set(
      SWP_MODULE_ID,
      "welcomeMessageVersion",
      SWP_WELCOME_VERSION
    );
  } catch (error) {
    console.error(
      "SWADE Weapon Properties | Could not create welcome message.",
      error
    );
  }
});
