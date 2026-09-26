# Frozen Mod

A *Frozen*-themed add-on for **Minecraft Bedrock Edition**, the version on phones (Android and iOS), tablets, consoles and Windows. It adds Elsa, Anna, Kristoff, Sven, Olaf and Marshmallow, ice powers, the Ice Castle, the kingdom of Arendelle and the Eternal Winter.

> Unofficial fan project. Not affiliated with or endorsed by Disney or Mojang/Microsoft.

## Easiest: download the Frozen World

1. Download **`Frozen_World.mcworld`** from the [latest release](https://github.com/VenTheZone/frozen-mod/releases/latest) and open it with Minecraft. The packs are included and turned on automatically.
2. Open the world **"Frozen - Kingdom of Arendelle"** from your worlds list.
3. Within about 5 seconds, Arendelle is built around you: Anna, Elsa, Kristoff, Sven and Olaf are in town. Elsa's Ice Castle stands 70 blocks north, guarded by Marshmallow. You get a starter kit too.

It's a flat, snowy survival world. The town is built by plain function commands, so it works even without the scripting features.

## Install as an add-on (phone or tablet)

1. Download **`Frozen.mcaddon`** from the [latest release](https://github.com/VenTheZone/frozen-mod/releases/latest).
2. Open the file:
   - **Android:** tap the downloaded file and choose Minecraft.
   - **iOS/iPadOS:** open it in the Files app, tap Share, then choose Minecraft.
   Minecraft imports both packs automatically.
3. Create or edit a world, go to **Behavior Packs**, and activate **Frozen (Behavior)**. The resource pack is added with it.
4. No experimental toggles are needed. Requires Minecraft Bedrock **1.21.90 or newer**.

## Playing

- **New world (recommended):** create a world with the add-on active. When you first join, **Arendelle is built around spawn** and the story begins.
- **Existing world:** you'll receive the starter kit. Open the **Frozen Storybook** and tap **Build Arendelle here** (it asks before replacing any blocks).
- **Starter kit** (once per player): Frozen Storybook, Elsa's Glove, 3 snowflake crystals, 8 carrots and an Olaf spawn egg.
- More Ice Castles and Arendelles also generate in unexplored snowy land.

### The story

Open the **Frozen Storybook** at any time to see your current chapter, goal and a hint.

1. **Coronation Day:** talk to Anna in Arendelle.
2. **Let It Go:** talk to Queen Elsa. She panics, flees, and the Eternal Winter begins.
3. **Reindeers Are Better Than People:** find Kristoff (he gives you carrots).
4. **In Summer:** give Olaf a carrot.
5. **The North Mountain:** travel 120 blocks and the Ice Castle rises ahead of you.
6. **Marshmallow:** defeat the castle's guardian.
7. **A Frozen Heart:** craft an Act of True Love.
8. **An Act of True Love:** give it to Anna or Elsa to bring summer back.

The story is shared by everyone in the world.

## What's inside

| Feature | How it works |
| --- | --- |
| Elsa's Glove | Use: ice blast. Sneak + use in the air: ice bridge (look up or down for stairs). Sneak + use on the ground: ring of ice spikes that knocks back and slows mobs. Conjured ice melts after 10–20 s. |
| Elsa | Trades the glove, snowflake crystals and emeralds. Fights back with ice blasts. **Hitting her starts the Eternal Winter.** |
| Anna | Give her (or Elsa) an **Act of True Love** to end the Eternal Winter. |
| Kristoff | Sells packed ice, blue ice and saddles, and buys carrots. |
| Olaf | Tame him with carrots (his nose!). He follows you and sits when you interact with him. |
| Sven | Tame him by riding or feeding carrots, then saddle and ride. |
| Marshmallow | 200 HP boss with a boss bar: slowing slams and ice-blast volleys. Drops snowflake crystals. |
| Eternal Winter | Snow piles up, water freezes and it keeps snowing around every player until true love thaws it. Survives restarts. |
| Items | Snowflake Crystal, Act of True Love, Ice Sword, Ice armor set, Magic Ice. |
| Ice Castle | On snowy mountains (frozen peaks, jagged peaks, snowy slopes). Elsa inside, Marshmallow at the gate, loot barrel upstairs. |
| Arendelle | In snowy plains and snowy taiga: colourful houses, a fountain, and the castle where Anna, Kristoff, Sven and Olaf live. |

**Recipes:** Glove = leather + 4 snowflake crystals + blue ice. Act of True Love = poppy + diamond + snowflake crystal. Ice sword and armor follow the vanilla patterns using blue ice, with a snowflake crystal in the middle. Crystals come from Elsa, Marshmallow and the Ice Castle loot.

**See a structure right away (cheats on):** `/structure load frozen:ice_castle ~ ~ ~` or `/structure load frozen:arendelle ~ ~ ~`.

## Manual test checklist

Bedrock can't run in CI, so check these on a device after importing:

- [ ] Both packs import, and the world loads with no content-log errors.
- [ ] A new world builds Arendelle at spawn, and you get the starter kit and the chapter 1 title.
- [ ] The storybook opens, and "Build Arendelle here" works in an existing world.
- [ ] Chapters advance: Anna, Elsa (she flees, the winter starts), Kristoff, Olaf, the castle rising after 120 blocks, Marshmallow, crafting the heart, true love.
- [ ] The glove fires blasts, builds a bridge or stairs, and summons spikes. The ice melts.
- [ ] Hitting Elsa starts the winter. The Act of True Love on Anna or Elsa ends it.
- [ ] Olaf tames with carrots. Sven can be tamed, saddled and ridden.
- [ ] Marshmallow shows a boss bar and drops crystals.
- [ ] `/structure load` of both structures spawns their characters. Naturally generated structures appear in new chunks.

## Repository layout

```
bedrock/   Bedrock add-on (the release): behavior_pack/, resource_pack/, src/ (TypeScript), tools/
java/      Original Java Edition version (Fabric 1.20.1)
```

### Build the add-on

Requires Node 22.6+ and Python 3.

```bash
cd bedrock
python3 tools/build.py        # tsc + unit tests + validation -> dist/Frozen.mcaddon
```

Regenerate the assets with `python3 tools/gen_textures.py` and `python3 tools/gen_structures.py`.

### Java Edition

`java/` holds the Fabric 1.20.1 mod (Java 17). See [java/README.md](java/README.md).

## License

[CC0 1.0](LICENSE). The code and generated art are public domain. *Frozen* and its characters belong to Disney.
