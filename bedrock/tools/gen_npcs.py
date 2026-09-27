#!/usr/bin/env python3
"""Generates behavior + client entity files for every talking humanoid NPC from one table.

Story characters stand at their posts and turn to face you; townsfolk and trolls stroll a
few blocks. All are immune to players and have a Talk button handled by src/conversation.ts.
Townsfolk use Minecraft's built-in NPC skins (referenced by path, nothing copied).
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BP = os.path.join(HERE, "..", "behavior_pack", "entities")
RP = os.path.join(HERE, "..", "resource_pack")
LANG = os.path.join(RP, "texts", "en_US.lang")

VANILLA_SKINS = [f"textures/entity/npc/npc_{i}" for i in range(1, 11)] + [f"textures/entity/npc/npc_Agriculture_{i}" for i in range(1, 11)]

# name: display name, spawn egg colours, options
NPCS = {
    "anna": ("Anna", "#283c6e", "#b4286e", {}),
    "elsa": ("Elsa", "#b4dcf5", "#f0ebc8", {"combat": True}),
    "kristoff": ("Kristoff", "#50505f", "#dcbe6e", {}),
    "hans": ("Prince Hans", "#e8e8f0", "#304c96", {"betrays": True}),
    "duke": ("Duke of Weselton", "#505060", "#c0c0c8", {"scale": 0.9}),
    "oaken": ("Wandering Oaken", "#3c6e46", "#d26e32", {"scale": 1.1}),
    "kai": ("Kai", "#1e1e23", "#e6e6e6", {}),
    "gerda": ("Gerda", "#28463c", "#f0f0f0", {}),
    "pabbie": ("Grand Pabbie", "#787d78", "#50a060", {"scale": 0.75}),
    "troll": ("Troll", "#6e736e", "#407040", {"scale": 0.6, "wander": True}),
    "guard": ("Royal Guard", "#50286e", "#c8a040", {}),
    "townsfolk": ("Townsperson", "#a08060", "#406080", {"wander": True, "skins": VANILLA_SKINS}),
}

PLAYER = {"test": "is_family", "subject": "other", "value": "player"}
TALK = {"interactions": [{
    "on_interact": {"filters": PLAYER, "event": "frozen:talked", "target": "self"},
    "interact_text": "action.interact.frozen_talk", "swing": True,
}]}
IMMUNE = {"triggers": [{"on_damage": {"filters": PLAYER}, "deals_damage": "no"}]}


def behavior(name, opts):
    comps = {
        "minecraft:type_family": {"family": ["frozen_npc", name, "mob"]},
        "minecraft:health": {"value": 40, "max": 40},
        "minecraft:collision_box": {"width": 0.6, "height": 1.95},
        "minecraft:movement": {"value": 0.5},
        "minecraft:navigation.walk": {"avoid_water": True, "can_open_doors": True},
        "minecraft:movement.basic": {},
        "minecraft:jump.static": {},
        "minecraft:can_climb": {},
        "minecraft:physics": {},
        "minecraft:pushable": {"is_pushable": False, "is_pushable_by_piston": True},
        "minecraft:breathable": {"total_supply": 15, "suffocate_time": 0},
        "minecraft:nameable": {},
        "minecraft:persistent": {},
        "minecraft:behavior.float": {"priority": 0},
        "minecraft:behavior.look_at_player": {"priority": 7, "look_distance": 8, "probability": 0.5},
        "minecraft:behavior.random_look_around": {"priority": 9},
    }
    groups, events = {}, {"frozen:talked": {}}
    if opts.get("scale"):
        comps["minecraft:scale"] = {"value": opts["scale"]}
    if opts.get("wander"):
        comps["minecraft:behavior.random_stroll"] = {"priority": 8, "speed_multiplier": 0.5}
        comps["minecraft:home"] = {"restriction_type": "random_movement", "restriction_radius": 4}
    if opts.get("combat"):
        comps["minecraft:shooter"] = {"def": "frozen:ice_blast"}
        comps["minecraft:behavior.hurt_by_target"] = {"priority": 1}
        comps["minecraft:behavior.ranged_attack"] = {"priority": 2, "attack_interval_min": 1.5, "attack_interval_max": 2.0, "attack_radius": 12}
    friendly = {"minecraft:interact": TALK, "minecraft:damage_sensor": IMMUNE}
    if opts.get("betrays"):
        groups["frozen:friendly"] = friendly
        groups["frozen:hostile"] = {
            "minecraft:boss": {"hud_range": 30, "should_darken_sky": False},
            "minecraft:attack": {"damage": 5},
            "minecraft:behavior.melee_box_attack": {"priority": 2, "track_target": True},
            "minecraft:behavior.nearest_attackable_target": {"priority": 1, "must_see": True, "entity_types": [{"filters": PLAYER, "max_dist": 24}]},
            "minecraft:behavior.hurt_by_target": {"priority": 1},
        }
        events["minecraft:entity_spawned"] = {"add": {"component_groups": ["frozen:friendly"]}}
        events["frozen:betray"] = {"remove": {"component_groups": ["frozen:friendly"]}, "add": {"component_groups": ["frozen:hostile"]}}
    else:
        comps.update(friendly)
    if opts.get("skins"):
        for i in range(len(opts["skins"])):
            groups[f"frozen:skin_{i}"] = {"minecraft:variant": {"value": i}}
        events["minecraft:entity_spawned"] = {"randomize": [{"weight": 1, "add": {"component_groups": [f"frozen:skin_{i}"]}} for i in range(len(opts["skins"]))]}
    entity = {"description": {"identifier": f"frozen:{name}", "is_spawnable": True, "is_summonable": True}, "components": comps, "events": events}
    if groups:
        entity["component_groups"] = groups
    return {"format_version": "1.21.90", "minecraft:entity": entity}


def client(name, egg, opts):
    desc = {"identifier": f"frozen:{name}", "spawn_egg": {"base_color": egg[0], "overlay_color": egg[1]}}
    if opts.get("skins"):
        desc.update({
            "materials": {"default": "entity_alphatest"},
            "textures": {f"skin_{i}": path for i, path in enumerate(opts["skins"])},
            "geometry": {"default": "geometry.npc"},
            "animations": {"general": "animation.npc.general", "look_at_target": "animation.common.look_at_target", "move": "animation.npc.move"},
            "scripts": {"animate": ["general", {"move": "query.modified_move_speed"}, "look_at_target"]},
            "render_controllers": [f"controller.render.frozen.{name}"],
        })
    else:
        desc.update({
            "materials": {"default": "entity_alphatest"},
            "textures": {"default": f"textures/entity/{name}"},
            "geometry": {"default": "geometry.humanoid.custom"},
            "animations": {
                "base_pose": "animation.humanoid.base_pose",
                "look_at_target": "animation.humanoid.look_at_target.default",
                "move": "animation.humanoid.move",
                "bob": "animation.humanoid.bob",
            },
            "scripts": {
                "pre_animation": ["variable.tcos0 = (Math.cos(query.modified_distance_moved * 38.17) * query.modified_move_speed / variable.gliding_speed_value) * 57.3;"],
                "animate": ["base_pose", "look_at_target", "move", "bob"],
            },
            "render_controllers": ["controller.render.default"],
        })
    return {"format_version": "1.10.0", "minecraft:client_entity": {"description": desc}}


def skin_controller(name, skins):
    return {"format_version": "1.8.0", "render_controllers": {f"controller.render.frozen.{name}": {
        "arrays": {"textures": {"Array.skins": [f"Texture.skin_{i}" for i in range(len(skins))]}},
        "geometry": "Geometry.default",
        "materials": [{"*": "Material.default"}],
        "textures": ["Array.skins[query.variant]"],
    }}}


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(json.dumps(data, indent="\t") + "\n")


def ensure_lang():
    lines = open(LANG, encoding="utf-8").read().rstrip("\n").split("\n")
    keys = {l.split("=", 1)[0] for l in lines if "=" in l}
    for name, (display, *_rest) in NPCS.items():
        for key, value in ((f"entity.frozen:{name}.name", display), (f"item.spawn_egg.entity.frozen:{name}.name", f"Spawn {display}")):
            if key not in keys:
                lines.append(f"{key}={value}")
    open(LANG, "w", encoding="utf-8").write("\n".join(lines) + "\n")


def main():
    for name, (_display, base, overlay, opts) in NPCS.items():
        write(os.path.join(BP, f"{name}.json"), behavior(name, opts))
        write(os.path.join(RP, "entity", f"{name}.entity.json"), client(name, (base, overlay), opts))
        if opts.get("skins"):
            write(os.path.join(RP, "render_controllers", f"{name}.render_controllers.json"), skin_controller(name, opts["skins"]))
    ensure_lang()
    print(f"generated {len(NPCS)} NPCs")


if __name__ == "__main__":
    main()
