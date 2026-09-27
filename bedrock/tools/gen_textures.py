#!/usr/bin/env python3
"""Writes the resource pack textures by reusing the Java generator. Stdlib only.

Differences from Java: vanilla Bedrock only ships the wide-arm humanoid model, so every skin
is drawn with 4px arms, and the armor layers go to textures/models/armor.
"""
import importlib.util
import os
import random
import shutil
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
RP = os.path.join(HERE, "..", "resource_pack")
BP = os.path.join(HERE, "..", "behavior_pack")
JAVA_GEN = os.path.join(HERE, "..", "..", "java", "tools", "gen_textures.py")
STORYBOOK = [
    "", "...nnnnnnnnnn...", "...nbbbbbbbbnw..", "...nbbbbcbbbnw..", "...nbcbbcbbcnw..",
    "...nbbcbcbcbnw..", "...nbbbwwwbbnw..", "...ncccwwwccnw..", "...nbbbwwwbbnw..",
    "...nbbcbcbcbnw..", "...nbcbbcbbcnw..", "...nbbbbcbbbnw..", "...nbbbbbbbbnw..",
    "...nnnnnnnnnnw..", "....wwwwwwwwww..",
]


def load_java_generator():
    spec = importlib.util.spec_from_file_location("java_gen_textures", JAVA_GEN)
    gen = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gen)
    return gen


def gen_cast(gen, rng):
    """Skins for the supporting cast, painted with the Java generator's humanoid() (64x64, wide arms)."""
    ent = os.path.join(RP, "textures", "entity")
    op = lambda c: (*c, 255)  # noqa: E731

    def stripe(y, color, x0=20, x1=27):
        return lambda img: img.rect(x0, y, x1 - x0 + 1, 1, color)

    def both(*fns):
        return lambda img: [f(img) for f in fns]

    def speckle(color, n, box=(0, 0, 64, 64)):
        def paint(img):
            for _ in range(n):
                img.set(rng.randint(box[0], box[2] - 1), rng.randint(box[1], box[3] - 1), color)
        return paint

    stone, moss, crystal = (120, 125, 120), (80, 120, 60), (120, 230, 240)
    cast = {
        "hans": ((170, 80, 40), op((245, 210, 190)), op((60, 120, 60)), (235, 235, 240), (235, 235, 240), (40, 50, 90), (25, 25, 30), False,
                 both(stripe(26, (220, 180, 60)), stripe(20, (220, 180, 60), 20, 21))),
        "duke": ((190, 190, 195), op((240, 200, 180)), op((50, 50, 50)), (70, 70, 80), (70, 70, 80), (60, 60, 70), (30, 30, 30), False,
                 stripe(24, (170, 40, 40))),
        "oaken": ((210, 110, 50), op((240, 190, 160)), op((60, 110, 190)), (60, 110, 70), (60, 110, 70), (90, 60, 40), (70, 45, 30), False,
                  both(stripe(22, (240, 240, 240)), stripe(28, (240, 240, 240)))),
        "kai": ((70, 50, 40), op((235, 200, 175)), op((70, 60, 50)), (30, 30, 35), (30, 30, 35), (30, 30, 35), (15, 15, 15), False,
                lambda img: img.rect(23, 20, 2, 8, (240, 240, 240))),
        "gerda": ((150, 140, 130), op((240, 205, 185)), op((70, 90, 70)), (40, 70, 60), (40, 70, 60), (40, 70, 60), (20, 20, 20), True,
                  lambda img: img.rect(21, 23, 6, 9, (245, 245, 240))),
        "pabbie": (moss, op(stone), op((220, 200, 80)), stone, stone, stone, (90, 95, 90), True,
                   both(speckle(moss, 90), lambda img: img.rect(23, 21, 2, 2, crystal))),
        "troll": (moss, op((110, 115, 110)), op((230, 200, 90)), (110, 115, 110), (110, 115, 110), (100, 105, 100), (80, 85, 80), False,
                  both(speckle(moss, 120), lambda img: img.rect(22, 21, 2, 1, crystal))),
        "guard": ((25, 25, 30), op((235, 200, 175)), op((60, 60, 70)), (80, 40, 110), (80, 40, 110), (40, 60, 40), (20, 20, 20), False,
                  both(stripe(21, (200, 160, 60)), stripe(26, (200, 160, 60)))),
    }
    for name, (hair, skin, eyes, body, sleeve, legs, shoes, long_hair, extra) in cast.items():
        gen.humanoid(rng, hair, skin, eyes, body, sleeve, legs, shoes, False, long_hair, extra).save(ent, f"{name}.png")


def main():
    gen = load_java_generator()
    wide_humanoid = gen.humanoid
    gen.humanoid = lambda rng, *a, **k: wide_humanoid(rng, *a[:7], False, *a[8:], **k)

    with tempfile.TemporaryDirectory() as tmp:
        gen.ROOT = tmp
        gen.TEX = os.path.join(RP, "textures")
        rng = random.Random(1225)
        gen.gen_items()
        gen.gen_blocks(rng)
        gen.gen_armor(rng)
        gen.gen_characters(rng)
        gen.gen_olaf(rng)
        gen.gen_sven(rng)
        gen.gen_marshmallow(rng)
        gen.Img(16, 16).save(gen.TEX, "block", "spawn_marker.png")
        gen.ascii_art(STORYBOOK).save(gen.TEX, "item", "storybook.png")
        gen_cast(gen, rng)

        armor_dst = os.path.join(RP, "textures", "models", "armor")
        os.makedirs(armor_dst, exist_ok=True)
        armor_src = os.path.join(tmp, "minecraft", "textures", "models", "armor")
        for name in os.listdir(armor_src):
            shutil.copy(os.path.join(armor_src, name), os.path.join(armor_dst, name))
        for pack in (RP, BP):
            shutil.copy(os.path.join(tmp, "frozen", "icon.png"), os.path.join(pack, "pack_icon.png"))
    print("textures written to", os.path.normpath(RP))


if __name__ == "__main__":
    main()
