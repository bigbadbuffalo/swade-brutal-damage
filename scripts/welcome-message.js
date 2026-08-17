const SWP_MODULE_ID = "swade-weapon-properties";
const SWP_WELCOME_VERSION = 2;
const SWP_README_URL =
  "https://github.com/bigbadbuffalo/swade-weapon-properties#readme";

Hooks.once("ready", async () => {
  /*
   * Only a GM should create the world-level welcome message.
   * This avoids every connected client posting the same message.
   */
  if (!game.user?.isGM) {
    return;
  }

  const shownVersion = Number(
    game.settings.get(
      SWP_MODULE_ID,
      "welcomeMessageVersion"
    ) ?? 0
  );

  if (shownVersion >= SWP_WELCOME_VERSION) {
    return;
  }

  const content = `
    <div class="swade-weapon-properties-welcome">
      <h2>SWADE Weapon Properties</h2>
      <p>
        This module adds custom weapon properties and optional
        Minimum Strength rules automation for SWADE.
      </p>

      <p><strong>Active Effect flags:</strong></p>
      <ul>
        <li><code>flags.swade-weapon-properties.brutal</code> — Brutal damage</li>
        <li><code>flags.swade-weapon-properties.offhand</code> — Off Hand weapon</li>
        <li><code>flags.swade-weapon-properties.minStrBonus</code> — Effective Minimum Strength bonus in die steps</li>
      </ul>

      <p>
        The earlier <code>flags.swade-weapon-properties.offHand</code>
        spelling and former <code>flags.swade-weapon-properties.light</code>
        flag remain supported for backward compatibility, but new
        Off Hand effects should use lowercase <code>offhand</code>.
      </p>

      <p>
        Minimum Strength automation options are available under
        <strong>Configure Settings → SWADE Weapon Properties</strong>.
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
      speaker: {
        alias: "SWADE Weapon Properties"
      },
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
