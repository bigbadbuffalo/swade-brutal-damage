# SWADE Brutal Damage

A small Foundry VTT module for the **Savage Worlds Adventure Edition** system.

It adds support for the **Brutal** quality on damage rolls. When Brutal is active, every damage die (including the Strength die and the Raise / bonus damage die) will re-roll any result of **1** until a non-1 is rolled (`rr1`).

I made this because I wanted to have more custom weapon effects in my game and the base system didn't seem to let me do this by default. It was all vibe coded by Grok, so hopefully it works! Mathematically, it is intended to be balanced with a totally different gear property, "Deadly," which adds an extra +1d6 to Raise damage, so it hopefully isn't too broken.

## How to use

### Actor-wide Brutal

Create an Active Effect on the actor with this change:

| Attribute Key                              | Change Mode | Value  |
|--------------------------------------------|-------------|--------|
| `flags.swade-brutal-damage.brutal`         | Override    | `true` |

### Weapon-specific Brutal

Create an Active Effect (on the actor or on the weapon itself) with this change:

| Attribute Key                                          | Change Mode | Value  |
|--------------------------------------------------------|-------------|--------|
| `@Weapon{Weapon Name}[flags.swade-brutal-damage.brutal]` | Override  | `true` |

Replace `Weapon Name` with the exact name of the weapon (or use the weapon’s ID).

You can also put the flag directly on a weapon item if you prefer.

## Installation

Manifest URL: https://github.com/bigbadbuffalo/swade-brutal-damage/releases/latest/download/module.json

## Compatibility

- Foundry VTT v12+
- SWADE system v4.0.0+

## License

MIT
