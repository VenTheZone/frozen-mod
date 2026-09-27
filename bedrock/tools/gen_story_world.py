#!/usr/bin/env python3
"""Builds dist/Frozen_Arendelle_Story.mcworld on top of the converted "Frozen Ghiacciata" map.

The map is third-party work: it is read from the given .mcworld (default: your Downloads)
and never stored in this repository. Its terrain and database are kept byte-for-byte; only
level.dat's name and spawn change. A setup pack places the story characters at spots found
by surveying the map (castle courtyard and keep, harbour docks, ice staircase, Ice Palace).

Usage: python3 tools/gen_story_world.py [path/to/Frozen Ghiacciata (Bedrock).mcworld]
"""
import json
import os
import shutil
import sys
import time
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gen_structures as gs  # noqa: E402
import gen_world as gw  # noqa: E402

DEFAULT_BASE = "/sdcard/Download/Frozen Ghiacciata (Bedrock).mcworld"
DOWNLOADS = "/sdcard/Download"
OUT_NAME = "FROZEN_STORY_Ghiacciata_Kingdom.mcworld"
WORLD_NAME = "★ Frozen STORY - Ghiacciata Kingdom (big map)"
SETUP_UUID = "3c7e9a1f-6b2d-4e8a-a5c3-9d1f7b2e4c60"
SETUP_MODULE_UUID = "7a4d2c8e-1f3b-4c9a-b6e5-2d8f0a3c1e97"
SETUP_VERSION = [1, 0, 0]

# Surveyed on the map: (x, y, z) is the air block a character stands in.
SPAWN = (145, 41, 25)  # castle courtyard, open sky, cobblestone floor at y=40
CHARACTERS = [
    ("anna", 130, 41, 25),         # castle courtyard
    ("elsa", 112, 42, 23),         # castle keep, ground floor behind the east doors
    ("kristoff", 300, 37, 60),     # harbour docks in town
    ("sven", 304, 37, 58),         # docks, next to Kristoff
    ("olaf", 371, 81, -270),       # foot of the ice staircase
    ("marshmallow", 373, 104, -318),  # top of the ice staircase, guarding the palace
    ("elsa", 372, 128, -348),      # Ice Palace hall
]
PALACE = (373, -320)  # chapter 5 is reached at the top of the staircase
GOALS = {0: (130, 25), 1: (112, 23), 2: (300, 60), 3: (371, -270), 4: PALACE, 5: (373, -318), 7: (130, 25)}
TICKING = [("frozen_castle", 125, 40, 25, 2), ("frozen_docks", 300, 36, 60, 1),
           ("frozen_olaf", 371, 80, -270, 1), ("frozen_palace", 373, 110, -330, 2)]
KIT = gw.KIT


def functions():
    tick = [
        "scoreboard objectives add frozen_world dummy",
        "scoreboard players set map frozen_world 1",
        "scoreboard players add built frozen_world 0",
        "execute if score built frozen_world matches 0 if entity @a run scoreboard players add timer frozen_world 1",
    ]
    tick += [f"execute if score timer frozen_world matches 1 run tickingarea add circle {x} {y} {z} {r} {name}"
             for name, x, y, z, r in TICKING]
    # Two passes: the far-away areas may still be loading on the first one; summons skip existing characters.
    tick += [
        "execute if score timer frozen_world matches 200 run function frozen_world/place",
        "execute if score timer frozen_world matches 400 run function frozen_world/place",
        "execute if score timer frozen_world matches 401 run function frozen_world/finish",
        # Players arriving from the converted save start wherever its old player stood, in Creative.
        f"tp @a[tag=!frozen_arrived] {SPAWN[0]} {SPAWN[1]} {SPAWN[2]}",
        "gamemode survival @a[tag=!frozen_arrived]",
        "tag @a[tag=!frozen_arrived] add frozen_arrived",
    ]
    tick += [f"give @a[tag=!frozen_kit] {item} {amount}" for item, amount in KIT]
    tick.append("tag @a[tag=!frozen_kit] add frozen_kit")

    place = [gw.summon(c, x, y, z) for c, x, y, z in CHARACTERS]
    place += [f"scoreboard players set castle_x frozen_world {PALACE[0]}", f"scoreboard players set castle_z frozen_world {PALACE[1]}"]
    for chapter, (x, z) in GOALS.items():
        place += [f"scoreboard players set goal{chapter}_x frozen_world {x}", f"scoreboard players set goal{chapter}_z frozen_world {z}"]

    finish = [f"tickingarea remove {name}" for name, *_ in TICKING]
    finish += [
        f"setworldspawn {SPAWN[0]} {SPAWN[1]} {SPAWN[2]}",
        "scoreboard players set built frozen_world 1",
        'tellraw @a {"rawtext":[{"translate":"frozen.world.ready_arendelle"}]}',
    ]
    return {"frozen_world/tick": tick, "frozen_world/place": place, "frozen_world/finish": finish}


def level_dat(base_raw):
    version = gs.struct.unpack_from("<i", base_raw)[0]
    data = gs.read_typed(base_raw[8:])
    data["LevelName"] = gs.String(WORLD_NAME)
    data["SpawnX"], data["SpawnY"], data["SpawnZ"] = (gs.Int(v) for v in SPAWN)
    data["LastPlayed"] = gs.Long(int(time.time()))
    body = bytearray()
    gs.write_named(body, "", data)
    return gs.struct.pack("<ii", version, len(body)) + bytes(body)


def main():
    base_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BASE
    if not os.path.exists(base_path):
        sys.exit(f"base world not found: {base_path}")
    base = zipfile.ZipFile(base_path)
    level = level_dat(base.read("level.dat"))

    bp, rp = gw.pack_version("behavior_pack"), gw.pack_version("resource_pack")
    setup_manifest = {
        "format_version": 2,
        "header": {"name": f"Frozen v{'.'.join(map(str, bp['version']))} - Story Setup",
                   "description": "Places the Frozen story characters on the Arendelle map.",
                   "uuid": SETUP_UUID, "version": SETUP_VERSION, "min_engine_version": [1, 21, 90]},
        "modules": [{"type": "data", "uuid": SETUP_MODULE_UUID, "version": SETUP_VERSION}],
    }
    os.makedirs(gw.DIST, exist_ok=True)
    out_path = os.path.join(gw.DIST, OUT_NAME)
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("level.dat", level)
        zf.writestr("level.dat_old", level)
        zf.writestr("levelname.txt", WORLD_NAME)
        for info in base.infolist():
            if info.filename.startswith("db/"):
                zf.writestr(info.filename, base.read(info.filename))
        zf.writestr("world_behavior_packs.json", json.dumps(
            [{"pack_id": bp["uuid"], "version": bp["version"]}, {"pack_id": SETUP_UUID, "version": SETUP_VERSION}], indent=2))
        zf.writestr("world_resource_packs.json", json.dumps([{"pack_id": rp["uuid"], "version": rp["version"]}], indent=2))
        setup = "behavior_packs/Frozen_Story_Setup/"
        zf.writestr(setup + "manifest.json", json.dumps(setup_manifest, indent=2))
        zf.write(os.path.join(gw.ROOT, "behavior_pack", "pack_icon.png"), setup + "pack_icon.png")
        zf.writestr(setup + "functions/tick.json", json.dumps({"values": ["frozen_world/tick"]}, indent=2))
        zf.writestr(setup + "entities/flag.json", json.dumps(gw.FLAG_ENTITY, indent=2))
        for name, lines in functions().items():
            zf.writestr(f"{setup}functions/{name}.mcfunction", "\n".join(lines) + "\n")
        for folder, (parent, name) in gw.PACK_DIRS.items():
            src = os.path.join(gw.ROOT, folder)
            for dirpath, _, files in os.walk(src):
                for f in sorted(files):
                    full = os.path.join(dirpath, f)
                    zf.write(full, f"{parent}/{name}/{os.path.relpath(full, src)}")
    verify(out_path, base)
    print(f"built {os.path.relpath(out_path, gw.ROOT)} ({os.path.getsize(out_path) // 1024} KB)")
    if os.path.isdir(DOWNLOADS):
        shutil.copy(out_path, os.path.join(DOWNLOADS, OUT_NAME))
        print(f"copied to {DOWNLOADS}/{OUT_NAME}")


def verify(path, base):
    import validate
    with zipfile.ZipFile(path) as zf:
        names = set(zf.namelist())
        for info in base.infolist():
            if info.filename.startswith("db/"):
                assert zf.read(info.filename) == base.read(info.filename), f"{info.filename} changed"
        data = validate.read_nbt(zf.read("level.dat")[8:])
        assert (data["SpawnX"], data["SpawnY"], data["SpawnZ"]) == SPAWN and data["LevelName"] == WORLD_NAME
        place = zf.read("behavior_packs/Frozen_Story_Setup/functions/frozen_world/place.mcfunction").decode()
        for c, x, y, z in CHARACTERS:
            assert gw.summon(c, x, y, z) in place
        manifests = [n for n in names if n.endswith("manifest.json")]
        for pack in json.loads(zf.read("world_behavior_packs.json")) + json.loads(zf.read("world_resource_packs.json")):
            assert any(json.loads(zf.read(m))["header"]["uuid"] == pack["pack_id"] for m in manifests), pack


if __name__ == "__main__":
    main()
