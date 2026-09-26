#!/usr/bin/env python3
"""Writes the Ice Castle and Arendelle .mcstructure files (little-endian NBT). Stdlib only.

Layouts mirror java/src/main/java/com/v/frozen/world/{IceCastlePiece,ArendellePiece}.java.
Local y=0 is the floor; a few foundation layers are added underneath because Bedrock
structure features can't fill down to the ground like the Java pieces do.
Doors are left as open doorways: door block states changed across Bedrock versions.
"""
import os
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "behavior_pack", "structures", "frozen")
BLOCK_VERSION = (1 << 24) | (21 << 16) | (90 << 8)  # 1.21.90

# --- little-endian NBT -------------------------------------------------------

class Byte(int): pass
class Int(int): pass
class String(str): pass

class NbtList:
    def __init__(self, tag, items):
        self.tag, self.items = tag, list(items)

TAG_END, TAG_BYTE, TAG_INT, TAG_STRING, TAG_LIST, TAG_COMPOUND = 0, 1, 3, 8, 9, 10


def tag_of(value):
    if isinstance(value, Byte): return TAG_BYTE
    if isinstance(value, (Int, int)) and not isinstance(value, bool): return TAG_INT
    if isinstance(value, str): return TAG_STRING
    if isinstance(value, NbtList): return TAG_LIST
    if isinstance(value, dict): return TAG_COMPOUND
    raise TypeError(type(value))


def write_payload(out, value):
    t = tag_of(value)
    if t == TAG_BYTE:
        out += struct.pack("<b", value)
    elif t == TAG_INT:
        out += struct.pack("<i", value)
    elif t == TAG_STRING:
        raw = value.encode("utf-8")
        out += struct.pack("<H", len(raw)) + raw
    elif t == TAG_LIST:
        out += struct.pack("<bi", value.tag if value.items else TAG_END, len(value.items))
        for item in value.items:
            write_payload(out, item)
    else:
        for name, child in value.items():
            write_named(out, name, child)
        out += bytes([TAG_END])


def write_named(out, name, value):
    raw = name.encode("utf-8")
    out += bytes([tag_of(value)]) + struct.pack("<H", len(raw)) + raw
    write_payload(out, value)


# --- structure builder --------------------------------------------------------

VOID = ("minecraft:structure_void", {})
AIR = ("minecraft:air", {})


def block(name, **states):
    return ("minecraft:" + name if ":" not in name else name, states)


class Structure:
    def __init__(self, width, height, depth, foundation):
        self.size = (width, height + foundation, depth)
        self.base = foundation
        self.cells = {}
        self.containers = {}

    def set(self, x, y, z, b):
        y += self.base
        w, h, d = self.size
        if 0 <= x < w and 0 <= y < h and 0 <= z < d:
            self.cells[(x, y, z)] = b

    def fill(self, x1, y1, z1, x2, y2, z2, b):
        for x in range(x1, x2 + 1):
            for y in range(y1, y2 + 1):
                for z in range(z1, z2 + 1):
                    self.set(x, y, z, b)

    def room(self, x1, y1, z1, x2, y2, z2, shell, inside):
        for x in range(x1, x2 + 1):
            for y in range(y1, y2 + 1):
                for z in range(z1, z2 + 1):
                    edge = x in (x1, x2) or y in (y1, y2) or z in (z1, z2)
                    self.set(x, y, z, shell if edge else inside)

    def foundation(self, b):
        w, _, d = self.size
        for y in range(-self.base, 0):
            self.fill(0, y, 0, w - 1, y, d - 1, b)

    def container(self, x, y, z, loot):
        self.set(x, y, z, block("barrel", facing_direction=Int(1), open_bit=Byte(0)))
        self.containers[(x, y + self.base, z)] = loot

    def marker(self, x, y, z, character):
        self.set(x, y, z, ("frozen:spawn_marker", {"frozen:character": String(character)}))

    def to_nbt(self):
        w, h, d = self.size
        palette, index_of, indices = [], {}, []
        for x in range(w):
            for y in range(h):
                for z in range(d):
                    b = self.cells.get((x, y, z), VOID)
                    key = (b[0], tuple(sorted(b[1].items())))
                    if key not in index_of:
                        index_of[key] = len(palette)
                        palette.append(b)
                    indices.append(index_of[key])
        position_data = {}
        for (x, y, z), loot in self.containers.items():
            position_data[str((x * h + y) * d + z)] = {"block_entity_data": {
                "id": String("Barrel"), "LootTable": String(loot), "LootTableSeed": Int(0),
                "Items": NbtList(TAG_COMPOUND, []), "Findable": Byte(0), "isMovable": Byte(1),
                "x": Int(x), "y": Int(y), "z": Int(z),
            }}
        return {
            "format_version": Int(1),
            "size": NbtList(TAG_INT, [Int(v) for v in self.size]),
            "structure_world_origin": NbtList(TAG_INT, [Int(0)] * 3),
            "structure": {
                "block_indices": NbtList(TAG_LIST, [
                    NbtList(TAG_INT, [Int(i) for i in indices]),
                    NbtList(TAG_INT, [Int(-1)] * len(indices)),
                ]),
                "entities": NbtList(TAG_COMPOUND, []),
                "palette": {"default": {
                    "block_palette": NbtList(TAG_COMPOUND, [
                        {"name": String(n), "states": dict(s), "version": Int(BLOCK_VERSION)} for n, s in palette
                    ]),
                    "block_position_data": position_data,
                }},
            },
        }

    def save(self, name):
        os.makedirs(OUT, exist_ok=True)
        out = bytearray()
        write_named(out, "", self.to_nbt())
        with open(os.path.join(OUT, name + ".mcstructure"), "wb") as f:
            f.write(out)
        return len(out)


# --- Ice Castle ---------------------------------------------------------------

def ice_castle():
    packed, blue = block("packed_ice"), block("blue_ice")
    glass, light = block("light_blue_stained_glass"), block("sea_lantern")
    stairs = block("quartz_stairs", weirdo_direction=Int(2), upside_down_bit=Byte(0))
    s = Structure(17, 34, 17, foundation=4)
    s.foundation(packed)
    s.fill(0, 1, 0, 16, 33, 16, AIR)
    s.fill(0, 0, 0, 16, 0, 16, packed)

    # main hall, its roof is the terrace
    s.room(2, 0, 2, 14, 11, 14, packed, AIR)
    for k in (5, 8, 11):
        s.fill(2, 3, k, 2, 6, k, glass)
        s.fill(14, 3, k, 14, 6, k, glass)
        s.fill(k, 3, 14, k, 6, 14, glass)
    s.fill(5, 3, 2, 5, 6, 2, glass)
    s.fill(11, 3, 2, 11, 6, 2, glass)
    s.fill(7, 1, 2, 9, 4, 2, AIR)
    for k in range(1, 12):
        s.set(3, k, 2 + k, stairs)
    s.fill(3, 11, 9, 3, 11, 12, AIR)
    for i in range(2, 15):
        s.set(i, 12, 14, glass)
        s.set(2, 12, i, glass)
        s.set(14, 12, i, glass)
    s.fill(6, 11, 0, 10, 11, 1, packed)
    s.fill(6, 12, 0, 10, 12, 0, glass)
    s.set(6, 12, 1, glass)
    s.set(10, 12, 1, glass)

    # upper hall opening onto the balcony
    s.room(4, 11, 4, 12, 19, 12, packed, AIR)
    for k in (6, 10):
        s.fill(4, 13, k, 4, 16, k, glass)
        s.fill(12, 13, k, 12, 16, k, glass)
        s.fill(k, 13, 12, k, 16, 12, glass)
    s.fill(7, 12, 4, 9, 14, 4, AIR)
    s.set(8, 11, 8, light)
    s.container(8, 12, 11, "loot_tables/chests/ice_castle.json")

    # snowflake floor
    for i in range(1, 16):
        for x, z in ((i, 8), (8, i), (i, i), (i, 16 - i)):
            s.set(x, 0, z, blue)
    for x, z in ((8, 8), (4, 4), (12, 4), (4, 12), (12, 12)):
        s.set(x, 0, z, light)

    # towers and spire
    for cx, cz in ((1, 1), (15, 1), (1, 15), (15, 15)):
        s.fill(cx - 1, 1, cz - 1, cx + 1, 16, cz + 1, packed)
        s.fill(cx, 17, cz, cx, 20, cz, blue)
    s.fill(7, 20, 7, 9, 27, 9, blue)
    s.fill(8, 28, 8, 8, 32, 8, blue)
    s.set(8, 33, 8, light)

    s.marker(8, 12, 8, "elsa")
    s.marker(8, 1, 0, "marshmallow")
    return s


# --- Arendelle ----------------------------------------------------------------

def arendelle():
    bricks, cobble = block("stone_bricks"), block("cobblestone")
    planks, log = block("spruce_planks"), block("spruce_log", pillar_axis=String("y"))
    roof, tower_roof = block("dark_oak_planks"), block("green_terracotta")
    glass, lantern = block("glass"), block("lantern", hanging=Byte(0))
    s = Structure(33, 16, 33, foundation=3)
    s.foundation(cobble)
    s.fill(0, 1, 0, 32, 15, 32, AIR)
    s.fill(0, 0, 0, 32, 0, 32, block("snow"))

    # plaza, paths and fountain
    s.fill(11, 0, 4, 21, 0, 18, bricks)
    s.fill(15, 0, 19, 17, 0, 20, bricks)
    for x1, z in ((9, 5), (9, 15), (22, 5), (22, 15)):
        s.fill(x1, 0, z, x1 + 1, 0, z, cobble)
    s.fill(14, 1, 9, 18, 1, 13, bricks)
    s.fill(15, 1, 10, 17, 1, 12, block("water", liquid_depth=Int(0)))
    s.fill(16, 1, 11, 16, 3, 11, bricks)
    s.set(16, 4, 11, lantern)

    def house(x0, z0, door_east, walls):
        x1, z1 = x0 + 6, z0 + 6
        s.room(x0, 0, z0, x1, 5, z1, block(walls), AIR)
        s.fill(x0, 0, z0, x1, 0, z1, planks)
        for cx, cz in ((x0, z0), (x1, z0), (x0, z1), (x1, z1)):
            s.fill(cx, 1, cz, cx, 5, cz, log)
        for i in range(5):
            s.fill(x0 - 1 + i, 6 + i, z0 - 1 + i, x1 + 1 - i, 6 + i, z1 + 1 - i, roof)
        s.fill(x0 + 2, 2, z0, x0 + 4, 3, z0, glass)
        s.fill(x0 + 2, 2, z1, x0 + 4, 3, z1, glass)
        door_x, window_x = (x1, x0) if door_east else (x0, x1)
        s.fill(window_x, 2, z0 + 2, window_x, 3, z0 + 4, glass)
        s.fill(door_x, 1, z0 + 3, door_x, 2, z0 + 3, AIR)
        s.set(x0 + 1, 1, z0 + 1, lantern)

    house(2, 2, True, "yellow_terracotta")
    house(2, 12, True, "light_blue_terracotta")
    house(24, 2, False, "pink_terracotta")
    house(24, 12, False, "lime_terracotta")

    # castle
    s.room(10, 0, 21, 22, 9, 30, bricks, AIR)
    for x in range(10, 23, 2):
        s.set(x, 10, 21, bricks)
        s.set(x, 10, 30, bricks)
    for z in range(21, 31, 2):
        s.set(10, 10, z, bricks)
        s.set(22, 10, z, bricks)
    for cx, cz in ((10, 21), (22, 21), (10, 30), (22, 30)):
        s.fill(cx - 1, 0, cz - 1, cx + 1, 12, cz + 1, bricks)
        s.fill(cx - 1, 13, cz - 1, cx + 1, 13, cz + 1, tower_roof)
        s.set(cx, 14, cz, tower_roof)
    s.fill(15, 1, 21, 17, 4, 21, AIR)
    for z in (24, 27):
        s.fill(10, 4, z, 10, 6, z, glass)
        s.fill(22, 4, z, 22, 6, z, glass)
    for x in (13, 16, 19):
        s.fill(x, 4, 30, x, 6, 30, glass)
    s.fill(16, 1, 22, 16, 1, 29, block("red_carpet"))
    for x, z in ((12, 23), (20, 23), (12, 28), (20, 28)):
        s.set(x, 1, z, lantern)
    s.container(14, 1, 29, "loot_tables/chests/arendelle.json")

    s.marker(16, 1, 28, "elsa")
    s.marker(15, 1, 26, "anna")
    s.marker(18, 1, 26, "kristoff")
    s.marker(20, 1, 17, "sven")
    s.marker(13, 1, 15, "olaf")
    return s


def main():
    for name, build in (("ice_castle", ice_castle), ("arendelle", arendelle)):
        size = build().save(name)
        print(f"wrote {name}.mcstructure ({size} bytes)")


if __name__ == "__main__":
    main()
