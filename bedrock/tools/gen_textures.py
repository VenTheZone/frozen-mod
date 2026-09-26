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


def load_java_generator():
    spec = importlib.util.spec_from_file_location("java_gen_textures", JAVA_GEN)
    gen = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gen)
    return gen


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
