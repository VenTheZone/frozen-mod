#!/usr/bin/env python3
"""Builds dist/Frozen_World.mcworld: a flat snowy world with the Frozen packs embedded.

The world ships level.dat plus an empty LevelDB, both taken from Mojang's flat test world in
minecraft-creator-tools (MIT, see world_template/NOTICE); Minecraft generates the terrain on
first load. A small world-only behavior pack builds Arendelle and the Ice Castle with plain
function commands, so it does not depend on the Script API.
"""
import json
import os
import sys
import time
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gen_structures as gs  # noqa: E402

ROOT = os.path.normpath(os.path.join(HERE, ".."))
DIST = os.path.join(ROOT, "dist")
WORLD_NAME = "Frozen - Kingdom of Arendelle (v1.2.3)"
WORLD_BP_UUID = "5b1f7c9e-2d4a-4f3b-9e8c-7a6d5c4b3a21"
WORLD_BP_MODULE_UUID = "8e2d4c6a-1b3f-4a5e-9c7d-2f4e6a8c0b13"
WORLD_BP_VERSION = [1, 0, 0]
PACK_DIRS = {"behavior_pack": ("behavior_packs", "Frozen_BP"), "resource_pack": ("resource_packs", "Frozen_RP")}

# Flat world: bedrock at y=-64, dirt -63..-62, snow at -61, so the floor of every building is y=-60.
FLOOR_Y = -60
FLAT_LAYERS = {
    # cold_beach (snowy beach): it still snows, but matches neither structure feature rule,
    # so no extra Arendelles or castles (each with its own characters) generate around the world's own.
    "biome_id": 26,
    "block_layers": [
        {"block_name": "minecraft:bedrock", "count": 1},
        {"block_name": "minecraft:dirt", "count": 2},
        {"block_name": "minecraft:snow", "count": 1},
    ],
    "encoding_version": 6,
    "structure_options": None,
    "world_version": "version.post_1_18",
}
SPAWN = (0, FLOOR_Y + 1, 0)
TOWN_PLAYER_LOCAL = (19, 16)  # the plaza spot the player stands on, same as src/setup.ts
CASTLE_CENTER = (8, -70)  # 70 blocks north of spawn; the castle is rotated so its door faces the town
KIT = [("frozen:storybook", 1), ("frozen:elsa_glove", 1), ("frozen:snowflake_crystal", 3), ("minecraft:carrot", 8)]


def placements():
    town = gs.arendelle(with_markers=False)
    castle = gs.ice_castle(with_markers=False)
    town_origin = (SPAWN[0] - TOWN_PLAYER_LOCAL[0], FLOOR_Y - town.base, SPAWN[2] - TOWN_PLAYER_LOCAL[1])
    castle_origin = (CASTLE_CENTER[0] - 8, FLOOR_Y - castle.base, CASTLE_CENTER[1] - 8)
    return [
        ("arendelle", town, town_origin, "0_degrees"),
        ("ice_castle", castle, castle_origin, "180_degrees"),
    ]


def world_pos(structure, origin, rotation, x, y, z):
    w, _, d = structure.size
    if rotation == "180_degrees":
        x, z = w - 1 - x, d - 1 - z
    return origin[0] + x, origin[1] + structure.base + y, origin[2] + z


def functions(places):
    tick = [
        "scoreboard objectives add frozen_world dummy",
        "scoreboard players add built frozen_world 0",
        "execute if score built frozen_world matches 0 if entity @a run scoreboard players add timer frozen_world 1",
        f"execute if score timer frozen_world matches 1 run tickingarea add circle {SPAWN[0]} {FLOOR_Y} {SPAWN[2]} 4 frozen_town",
        f"execute if score timer frozen_world matches 1 run tickingarea add circle {CASTLE_CENTER[0]} {FLOOR_Y} {CASTLE_CENTER[1]} 2 frozen_castle",
        "execute if score timer frozen_world matches 100 run function frozen_world/build",
    ]
    tick += [f"give @a[tag=!frozen_kit] {item} {amount}" for item, amount in KIT]
    tick.append("tag @a[tag=!frozen_kit] add frozen_kit")

    build = []
    for name, structure, origin, rotation in places:
        build.append(f"structure load frozen_world:{name} {origin[0]} {origin[1]} {origin[2]} {rotation}")
    for name, structure, origin, rotation in places:
        for x, y, z, character in structure.markers:
            wx, wy, wz = world_pos(structure, origin, rotation, x, y, z)
            build.append(f"summon frozen:{character} {wx} {wy} {wz}")
    build += [
        f"scoreboard players set castle_x frozen_world {CASTLE_CENTER[0]}",
        f"scoreboard players set castle_z frozen_world {CASTLE_CENTER[1]}",
        f"setworldspawn {SPAWN[0]} {SPAWN[1]} {SPAWN[2]}",
        f"spawnpoint @a {SPAWN[0]} {SPAWN[1]} {SPAWN[2]}",
        f"tp @a {SPAWN[0]} {SPAWN[1]} {SPAWN[2]}",
        "tickingarea remove frozen_town",
        "tickingarea remove frozen_castle",
        "scoreboard players set built frozen_world 1",
        'tellraw @a {"rawtext":[{"translate":"frozen.world.ready"}]}',
    ]
    return {"frozen_world/tick": tick, "frozen_world/build": build}


TEMPLATE = os.path.join(HERE, "world_template")
KINDS = {"byte": gs.Byte, "int": gs.Int, "long": gs.Long, "float": gs.Float, "string": gs.String}
TAGS = {gs.Byte: gs.TAG_BYTE, gs.Int: gs.TAG_INT, gs.Long: gs.TAG_LONG, gs.Float: gs.TAG_FLOAT, gs.String: gs.TAG_STRING}


def decode(entry):
    kind, value = entry
    if kind == "compound":
        return {k: decode(v) for k, v in value.items()}
    if kind == "list":
        items = [decode(v) for v in value]
        tag = gs.TAG_COMPOUND if items and isinstance(items[0], dict) else TAGS.get(type(items[0]), gs.TAG_END) if items else gs.TAG_END
        return gs.NbtList(tag, items)
    return KINDS[kind](value)


def level_dat():
    """Mojang's flat test world level.dat (every field and type as the game wrote it) with Frozen overrides."""
    data = {k: decode(v) for k, v in json.load(open(os.path.join(TEMPLATE, "level.json"))).items()}
    data.update({
        "LevelName": gs.String(WORLD_NAME),
        "FlatWorldLayers": gs.String(json.dumps(FLAT_LAYERS, separators=(",", ":"))),
        "SpawnX": gs.Int(SPAWN[0]), "SpawnY": gs.Int(SPAWN[1]), "SpawnZ": gs.Int(SPAWN[2]),
        "RandomSeed": gs.Long(1225),
        "GameType": gs.Int(0), "Difficulty": gs.Int(2),
        "commandsEnabled": gs.Byte(0), "hasBeenLoadedInCreative": gs.Byte(0),
        "experiments": {},
        "LastPlayed": gs.Long(int(time.time())), "Time": gs.Long(1000), "currentTick": gs.Long(0),
        "worldStartCount": gs.Long(0),
    })
    body = bytearray()
    gs.write_named(body, "", data)
    return gs.struct.pack("<ii", int(data["StorageVersion"]), len(body)) + bytes(body)


def pack_version(folder):
    return json.load(open(os.path.join(ROOT, folder, "manifest.json")))["header"]


def main():
    places = placements()
    staging_structures = {}
    for name, structure, _, _ in places:
        out = bytearray()
        gs.write_named(out, "", structure.to_nbt())
        staging_structures[name] = bytes(out)

    world_manifest = {
        "format_version": 2,
        "header": {
            "name": "Frozen v1.2.3 - World Setup",
            "description": "Builds Arendelle and the Ice Castle when this world first loads.",
            "uuid": WORLD_BP_UUID, "version": WORLD_BP_VERSION, "min_engine_version": [1, 21, 90],
        },
        "modules": [{"type": "data", "uuid": WORLD_BP_MODULE_UUID, "version": WORLD_BP_VERSION}],
    }
    bp, rp = pack_version("behavior_pack"), pack_version("resource_pack")
    world_bps = [{"pack_id": bp["uuid"], "version": bp["version"]}, {"pack_id": WORLD_BP_UUID, "version": WORLD_BP_VERSION}]
    world_rps = [{"pack_id": rp["uuid"], "version": rp["version"]}]

    os.makedirs(DIST, exist_ok=True)
    out_path = os.path.join(DIST, "Frozen_World.mcworld")
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
        level = level_dat()
        zf.writestr("level.dat", level)
        zf.writestr("level.dat_old", level)
        zf.writestr("levelname.txt", WORLD_NAME)
        zf.writestr("world_behavior_packs.json", json.dumps(world_bps, indent=2))
        zf.writestr("world_resource_packs.json", json.dumps(world_rps, indent=2))
        # A freshly created, empty LevelDB exactly as the game writes it; terrain is generated on first load.
        for name in ("CURRENT", "MANIFEST-000002"):
            zf.write(os.path.join(TEMPLATE, "db", name), f"db/{name}")
        zf.writestr("db/000003.log", b"")
        world_bp = "behavior_packs/Frozen_World_BP/"
        zf.writestr(world_bp + "manifest.json", json.dumps(world_manifest, indent=2))
        zf.write(os.path.join(ROOT, "behavior_pack", "pack_icon.png"), world_bp + "pack_icon.png")
        zf.writestr(world_bp + "functions/tick.json", json.dumps({"values": ["frozen_world/tick"]}, indent=2))
        for name, lines in functions(places).items():
            zf.writestr(f"{world_bp}functions/{name}.mcfunction", "\n".join(lines) + "\n")
        for name, data in staging_structures.items():
            zf.writestr(f"{world_bp}structures/frozen_world/{name}.mcstructure", data)
        for folder, (parent, name) in PACK_DIRS.items():
            base = os.path.join(ROOT, folder)
            for dirpath, _, files in os.walk(base):
                for f in sorted(files):
                    full = os.path.join(dirpath, f)
                    zf.write(full, f"{parent}/{name}/{os.path.relpath(full, base)}")
    verify(out_path, places)
    print(f"built {os.path.relpath(out_path, ROOT)} ({os.path.getsize(out_path) // 1024} KB)")


def verify(path, places):
    """Reads the archive back: level.dat parses, and every command targets something that exists."""
    import validate
    with zipfile.ZipFile(path) as zf:
        names = set(zf.namelist())
        raw = zf.read("level.dat")
        version, length = gs.struct.unpack_from("<ii", raw)
        data = validate.read_nbt(raw[8:])
        assert version == data["StorageVersion"] and length == len(raw) - 8, "level.dat header"
        assert data["experiments"] == {}, "no experiments may be enabled"
        assert zf.read("db/CURRENT") == b"MANIFEST-000002\n"
        assert data["Generator"] == 2 and json.loads(data["FlatWorldLayers"])["block_layers"], "flat world"
        assert data["SpawnY"] == FLOOR_Y + 1
        build = zf.read("behavior_packs/Frozen_World_BP/functions/frozen_world/build.mcfunction").decode()
        for name, structure, origin, rotation in places:
            assert f"behavior_packs/Frozen_World_BP/structures/frozen_world/{name}.mcstructure" in names
            for x, y, z, character in structure.markers:
                wx, wy, wz = world_pos(structure, origin, rotation, x, y, z)
                w, h, d = structure.size
                assert origin[0] <= wx < origin[0] + w and origin[2] <= wz < origin[2] + d, f"{character} outside {name}"
                assert wy == FLOOR_Y + y, f"{character} not on the floor"
                assert f"summon frozen:{character} {wx} {wy} {wz}" in build
        for pack in json.loads(zf.read("world_behavior_packs.json")) + json.loads(zf.read("world_resource_packs.json")):
            manifests = [n for n in names if n.endswith("manifest.json")]
            assert any(json.loads(zf.read(m))["header"]["uuid"] == pack["pack_id"] for m in manifests), pack


if __name__ == "__main__":
    main()
