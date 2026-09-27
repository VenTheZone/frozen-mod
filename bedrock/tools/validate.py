#!/usr/bin/env python3
"""Cross-checks the behavior and resource packs, scripts and structures. Exits 1 on any problem."""
import glob
import json
import os
import re
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
BP = os.path.join(ROOT, "behavior_pack")
RP = os.path.join(ROOT, "resource_pack")
OWN_TEXTURE_DIRS = ("textures/entity/", "textures/item/", "textures/block/", "textures/models/armor/")
# Built into Minecraft, referenced by path.
VANILLA_TEXTURES = ("textures/entity/npc/",)

problems = []


def problem(msg):
    problems.append(msg)


def load_all(pack, sub):
    out = {}
    for path in glob.glob(os.path.join(pack, sub, "**", "*.json"), recursive=True):
        try:
            with open(path, encoding="utf-8") as f:
                out[os.path.relpath(path, pack)] = json.load(f)
        except json.JSONDecodeError as e:
            problem(f"{os.path.relpath(path, ROOT)}: invalid JSON ({e})")
    return out


def texture_exists(path):
    return os.path.exists(os.path.join(RP, path + ".png"))


def read_nbt(data):
    """Minimal little-endian NBT reader for the tags gen_structures.py writes."""
    pos = 0

    def take(fmt):
        nonlocal pos
        value = struct.unpack_from("<" + fmt, data, pos)
        pos += struct.calcsize("<" + fmt)
        return value[0]

    def string():
        nonlocal pos
        n = take("H")
        s = data[pos:pos + n].decode("utf-8")
        pos += n
        return s

    def payload(tag):
        if tag == 1: return take("b")
        if tag == 3: return take("i")
        if tag == 4: return take("q")
        if tag == 5: return take("f")
        if tag == 8: return string()
        if tag == 9:
            inner, n = take("b"), take("i")
            return [payload(inner) for _ in range(n)]
        if tag == 10:
            out = {}
            while True:
                t = take("B")
                if t == 0: return out
                name = string()
                out[name] = payload(t)
        raise ValueError(f"unsupported tag {tag}")

    assert take("B") == 10
    string()
    return payload(10)


def main():
    bp_entities = load_all(BP, "entities")
    rp_entities = load_all(RP, "entity")
    items = load_all(BP, "items")
    blocks = load_all(BP, "blocks")
    recipes = load_all(BP, "recipes")
    features = load_all(BP, "features")
    rules = load_all(BP, "feature_rules")
    attachables = load_all(RP, "attachables")
    load_all(BP, "loot_tables")
    load_all(BP, "trading")
    load_all(RP, "render_controllers")
    item_atlas = json.load(open(os.path.join(RP, "textures", "item_texture.json")))["texture_data"]
    terrain_atlas = json.load(open(os.path.join(RP, "textures", "terrain_texture.json")))["texture_data"]
    lang = dict(line.split("=", 1) for line in open(os.path.join(RP, "texts", "en_US.lang"), encoding="utf-8")
                if "=" in line and not line.startswith("#"))
    scripts = "".join(open(p, encoding="utf-8").read() for p in glob.glob(os.path.join(ROOT, "src", "*.ts")))

    # manifests
    bpm = json.load(open(os.path.join(BP, "manifest.json")))
    rpm = json.load(open(os.path.join(RP, "manifest.json")))
    if not any(d.get("uuid") == rpm["header"]["uuid"] for d in bpm["dependencies"]):
        problem("behavior manifest does not depend on the resource pack")
    if not any(d.get("uuid") == bpm["header"]["uuid"] for d in rpm["dependencies"]):
        problem("resource manifest does not depend on the behavior pack")

    # atlases point at real textures
    for key, entry in {**item_atlas, **terrain_atlas}.items():
        if not texture_exists(entry["textures"]):
            problem(f"atlas entry {key}: missing {entry['textures']}.png")

    # entities: behavior <-> client, textures, lang, loot, trades, projectiles
    bp_ids = {d["minecraft:entity"]["description"]["identifier"]: d for d in bp_entities.values()}
    rp_ids = {d["minecraft:client_entity"]["description"]["identifier"]: d for d in rp_entities.values()}
    for eid in bp_ids.keys() - rp_ids.keys():
        problem(f"entity {eid} has no client entity")
    for eid in rp_ids.keys() - bp_ids.keys():
        problem(f"client entity {eid} has no behavior entity")
    rc_ids = set()
    for rc in load_all(RP, "render_controllers").values():
        rc_ids |= set(rc["render_controllers"])
    for eid, d in rp_ids.items():
        desc = d["minecraft:client_entity"]["description"]
        for tex in desc.get("textures", {}).values():
            if tex.startswith(OWN_TEXTURE_DIRS) and not tex.startswith(VANILLA_TEXTURES) and not texture_exists(tex):
                problem(f"{eid}: missing texture {tex}.png")
        for rc in desc.get("render_controllers", []):
            name = rc if isinstance(rc, str) else next(iter(rc))
            if name.startswith("controller.render.frozen") and name not in rc_ids:
                problem(f"{eid}: unknown render controller {name}")
    for eid, d in bp_ids.items():
        e = d["minecraft:entity"]
        comps = dict(e.get("components", {}))
        for group in e.get("component_groups", {}).values():
            comps.update(group)
        if e["description"].get("is_spawnable"):
            for key in (f"entity.{eid}.name", f"item.spawn_egg.entity.{eid}.name"):
                if key not in lang:
                    problem(f"missing lang key {key}")
        for path in [comps.get("minecraft:loot", {}).get("table"), comps.get("minecraft:economy_trade_table", {}).get("table")]:
            if path and not os.path.exists(os.path.join(BP, path)):
                problem(f"{eid}: missing {path}")
        shooter = comps.get("minecraft:shooter", {}).get("def")
        if shooter and shooter.startswith("frozen:") and shooter not in bp_ids:
            problem(f"{eid}: shooter projectile {shooter} not defined")
        for event_ref in re.findall(r'"event": "([^"]+)"', json.dumps(e)):
            if event_ref not in e.get("events", {}):
                problem(f"{eid}: event {event_ref} not defined")
        for group_ref in re.findall(r'"component_groups": \[([^\]]*)\]', json.dumps(e.get("events", {}))):
            for g in re.findall(r'"([^"]+)"', group_ref):
                if g not in e.get("component_groups", {}):
                    problem(f"{eid}: component group {g} not defined")

    # items and blocks
    own_ids = set()
    for d in items.values():
        item = d["minecraft:item"]
        iid = item["description"]["identifier"]
        own_ids.add(iid)
        comps = item["components"]
        icon = comps.get("minecraft:icon")
        if icon not in item_atlas:
            problem(f"{iid}: icon {icon} not in item_texture.json")
        name_key = comps.get("minecraft:display_name", {}).get("value")
        if name_key not in lang:
            problem(f"{iid}: missing lang key {name_key}")
        if "minecraft:wearable" in comps and iid not in {a["minecraft:attachable"]["description"]["identifier"] for a in attachables.values()}:
            problem(f"{iid}: wearable without attachable")
    for a in attachables.values():
        desc = a["minecraft:attachable"]["description"]
        for tex in desc["textures"].values():
            if tex.startswith(OWN_TEXTURE_DIRS) and not texture_exists(tex):
                problem(f"attachable {desc['identifier']}: missing {tex}.png")
    for d in blocks.values():
        blk = d["minecraft:block"]
        bid = blk["description"]["identifier"]
        own_ids.add(bid)
        comps = blk["components"]
        for inst in comps.get("minecraft:material_instances", {}).values():
            if inst["texture"] not in terrain_atlas:
                problem(f"{bid}: texture {inst['texture']} not in terrain_texture.json")
        if comps.get("minecraft:display_name") not in lang:
            problem(f"{bid}: missing lang key {comps.get('minecraft:display_name')}")
        loot = comps.get("minecraft:loot")
        if loot and not os.path.exists(os.path.join(BP, loot)):
            problem(f"{bid}: missing {loot}")

    # custom components used in JSON are registered in scripts
    used = set(re.findall(r'"(frozen:[a-z_]+)": \{\}', json.dumps({**items, **blocks})))
    for comp in used:
        if f'"{comp}"' not in scripts:
            problem(f"custom component {comp} is never registered in src/")
    for key in set(re.findall(r'translate: "([^"]+)"', scripts)):
        if key not in lang:
            problem(f"script uses missing lang key {key}")
    storyline = open(os.path.join(ROOT, "src", "storyline.ts"), encoding="utf-8").read()
    for chapter in re.findall(r'\{ id: "([a-z_]+)"', storyline) + ["complete"]:
        for part in ("title", "goal", "hint"):
            if f"frozen.story.{chapter}.{part}" not in lang:
                problem(f"missing lang key frozen.story.{chapter}.{part}")
    conversation = open(os.path.join(ROOT, "src", "conversation.ts"), encoding="utf-8").read()
    talkers = re.findall(r'"([a-z_]+)"', re.search(r"TALKERS = \[([^\]]*)\]", conversation).group(1))
    for name in talkers:
        entity = bp_ids.get(f"frozen:{name}")
        if not entity:
            problem(f"talker {name} is not an entity")
        elif "frozen:talked" not in json.dumps(entity):
            problem(f"frozen:{name} has no Talk interaction")
    for chapter in re.findall(r'\{ id: "([a-z_]+)"', storyline) + ["complete"]:
        if f"frozen.story.{chapter}.hint.arendelle" not in lang:
            problem(f"missing lang key frozen.story.{chapter}.hint.arendelle")
    spawn_eggs = {f"{eid}_spawn_egg" for eid, d in bp_ids.items() if d["minecraft:entity"]["description"].get("is_spawnable")}
    for kit_item in re.findall(r'\["(frozen:[a-z_]+)", \d+\]', scripts):
        if kit_item not in own_ids | spawn_eggs:
            problem(f"starter kit gives unknown item {kit_item}")

    # recipes only use known frozen ids
    for path, d in recipes.items():
        recipe = next(v for k, v in d.items() if k.startswith("minecraft:recipe"))
        refs = re.findall(r'"(frozen:[a-z_]+)"', json.dumps({k: v for k, v in recipe.items() if k != "description"}))
        for ref in refs:
            if ref not in own_ids:
                problem(f"{path}: unknown id {ref}")

    # loot tables and trades reference known ids
    for path in glob.glob(os.path.join(BP, "loot_tables", "**", "*.json"), recursive=True) + glob.glob(os.path.join(BP, "trading", "*.json")):
        for ref in re.findall(r'"(frozen:[a-z_]+)"', open(path).read()):
            if ref not in own_ids:
                problem(f"{os.path.relpath(path, ROOT)}: unknown id {ref}")

    # worldgen: rules -> features -> structures, and structure contents
    feature_ids = {v["minecraft:structure_template_feature"]["description"]["identifier"]: v for v in features.values()}
    for d in rules.values():
        target = d["minecraft:feature_rules"]["description"]["places_feature"]
        if target not in feature_ids:
            problem(f"feature rule places unknown feature {target}")
    marker_states = set()
    for d in blocks.values():
        blk = d["minecraft:block"]
        if blk["description"]["identifier"] == "frozen:spawn_marker":
            marker_states = set(blk["description"]["states"]["frozen:character"])
    for fid, d in feature_ids.items():
        sname = d["minecraft:structure_template_feature"]["structure_name"]
        ns, name = sname.split(":")
        spath = os.path.join(BP, "structures", ns, name + ".mcstructure")
        if not os.path.exists(spath):
            problem(f"{fid}: missing structure {spath}")
            continue
        nbt = read_nbt(open(spath, "rb").read())
        w, h, dd = nbt["size"]
        layers = nbt["structure"]["block_indices"]
        palette = nbt["structure"]["palette"]["default"]["block_palette"]
        if len(layers[0]) != w * h * dd:
            problem(f"{sname}: {len(layers[0])} indices for size {w}x{h}x{dd}")
        if max(layers[0]) >= len(palette):
            problem(f"{sname}: block index outside palette")
        for entry in palette:
            if entry["name"].startswith("frozen:") and entry["name"] not in own_ids:
                problem(f"{sname}: unknown block {entry['name']}")
            character = entry["states"].get("frozen:character")
            if character is not None:
                if character not in marker_states:
                    problem(f"{sname}: marker state {character} not declared on the block")
                if f"frozen:{character}" not in bp_ids:
                    problem(f"{sname}: marker spawns unknown entity frozen:{character}")
        for data in nbt["structure"]["palette"]["default"]["block_position_data"].values():
            loot = data["block_entity_data"].get("LootTable")
            if loot and not os.path.exists(os.path.join(BP, loot)):
                problem(f"{sname}: container loot {loot} missing")

    if problems:
        print("validation FAILED:")
        for p in problems:
            print("  -", p)
        sys.exit(1)
    print(f"validation OK: {len(bp_ids)} entities, {len(items)} items, {len(blocks)} blocks, "
          f"{len(recipes)} recipes, {len(feature_ids)} structures")


if __name__ == "__main__":
    main()
