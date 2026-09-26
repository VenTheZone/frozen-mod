#!/usr/bin/env python3
"""Generates every Frozen mod texture. Stdlib only. Run from the frozen/ directory."""
import os
import random
import struct
import zlib

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "main", "resources", "assets")
TEX = os.path.join(ROOT, "frozen", "textures")
CLEAR = (0, 0, 0, 0)


class Img:
    def __init__(self, w, h, fill=CLEAR):
        self.w, self.h = w, h
        self.px = [fill] * (w * h)

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y * self.w + x] = c if len(c) == 4 else (*c, 255)

    def rect(self, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.set(xx, yy, c)

    def save(self, *path):
        full = os.path.join(*path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        raw = b"".join(
            b"\x00" + bytes(v for p in self.px[y * self.w:(y + 1) * self.w] for v in p) for y in range(self.h)
        )

        def chunk(tag, data):
            return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

        with open(full, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n")
            f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0)))
            f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
            f.write(chunk(b"IEND", b""))


def jitter(rng, c, amount=12, alpha=255):
    return tuple(max(0, min(255, v + rng.randint(-amount, amount))) for v in c[:3]) + (alpha,)


def noise_fill(img, rng, base, amount=12, alpha=255, x=0, y=0, w=None, h=None):
    for yy in range(y, y + (h if h is not None else img.h)):
        for xx in range(x, x + (w if w is not None else img.w)):
            img.set(xx, yy, jitter(rng, base, amount, alpha))


def box(img, u, v, w, h, d, paint):
    """Paints a model cuboid's UV layout. paint(face, x, y, fw, fh) -> color or None."""
    faces = {
        "top": (u + d, v, w, d),
        "bottom": (u + d + w, v, w, d),
        "right": (u, v + d, d, h),
        "front": (u + d, v + d, w, h),
        "left": (u + d + w, v + d, d, h),
        "back": (u + d + w + d, v + d, w, h),
    }
    for face, (fx, fy, fw, fh) in faces.items():
        for y in range(fh):
            for x in range(fw):
                c = paint(face, x, y, fw, fh)
                if c is not None:
                    img.set(fx + x, fy + y, c)


# ---------- items (ASCII pixel art) ----------

PALETTE = {
    "b": (60, 120, 200), "c": (150, 215, 245), "w": (255, 255, 255), "d": (110, 70, 40),
    "r": (220, 30, 50), "R": (150, 15, 35), "g": (230, 190, 60), "n": (40, 80, 160),
}


def ascii_art(rows, top=0):
    img = Img(16, 16)
    for y, row in enumerate(rows):
        assert len(row) <= 16, row
        for x, ch in enumerate(row):
            if ch in PALETTE:
                img.set(x, top + y, PALETTE[ch])
    return img


def snowflake(size=16):
    img = Img(size, size)
    c = size // 2 - 1
    arm = size // 2 - 2
    for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)]:
        for i in range(1, arm + 1):
            img.set(c + dx * i, c + dy * i, PALETTE["w"] if i == arm else PALETTE["c"])
        if dx == 0 or dy == 0:
            px, py = dy, dx
            for side in (1, -1):
                k = arm * 2 // 3
                img.set(c + dx * (k + 1) + px * side, c + dy * (k + 1) + py * side, PALETTE["b"])
    img.set(c, c, PALETTE["w"])
    return img


ITEMS = {
    "elsa_glove": [
        "", ".....b.b.b......", "....bcbcbcb.....", "....bcbcbcb.....", "....bcbcbcb.b...",
        "....bcbcbcbbcb..", "....bcccccbcb...", "....bcccccccb...", "....bccwccccb...",
        ".....bcccccb....", ".....bcccccb....", ".....bnnnnnb....", ".....bnwnwnb....",
        ".....bnnnnnb....", "......bbbbb.....",
    ],
    "ice_sword": [
        "", ".............wc.", "............wcc.", "...........wcc..", "..........wcc...",
        ".........wcc....", "........wcc.....", ".......wcc......", "..b...wcc.......",
        "...b.wcc........", "....bcc.........", ".....b..........", "....d.b.........",
        "...d............", "..d.............",
    ],
    "true_love_heart": [
        "", "", "...RRR...RRR....", "..RwwrR.RrrrR...", ".RrwrrrRrrrrrR..", ".Rrrrrrrrrrrrr..",
        ".Rrrrrrrrrrrrr..", "..Rrrrrrrrrrr...", "...Rrrrrrrrr....", "....Rrrrrrr.....",
        ".....Rrrrr......", "......Rrr.......", ".......R........",
    ],
    "ice_helmet": [
        "", "", "", "....bbbbbbbb....", "...bccccccccb...", "...bcwccccccb...", "...bccccccccb...",
        "...bcb....bcb...", "...bcb....bcb...", "...bbb....bbb...",
    ],
    "ice_chestplate": [
        "", "", "..bbb......bbb..", ".bcccb....bcccb.", ".bccccbbbbccccb.", ".bcwccccccccccb.",
        ".bbbccccccccbbb.", "...bccccccccb...", "...bcccwccccb...", "...bccccccccb...",
        "...bccccccccb...", "...bccccccccb...", "...bbbbbbbbbb...",
    ],
    "ice_leggings": [
        "", "", "...bbbbbbbbbb...", "...bccccccccb...", "...bcwccccccb...", "...bccccccccb...",
        "...bcccbbcccb...", "...bccb..bccb...", "...bccb..bccb...", "...bccb..bccb...",
        "...bccb..bccb...", "...bccb..bccb...", "...bccb..bccb...", "...bbbb..bbbb...",
    ],
    "ice_boots": [
        "", "", "", "", "", "", "..bbbb....bbbb..", "..bccb....bccb..", "..bcwb....bccb..",
        "..bccb....bccb..", ".bcccb...bcccb..", ".bccccb..bccccb.", ".bbbbbb..bbbbbb.",
    ],
}


def gen_items():
    snowflake().save(TEX, "item", "snowflake_crystal.png")
    for name, rows in ITEMS.items():
        ascii_art(rows).save(TEX, "item", name + ".png")
    icon = snowflake(16)
    big = Img(64, 64)
    for y in range(64):
        for x in range(64):
            big.px[y * 64 + x] = icon.px[(y // 4) * 16 + x // 4]
    big.save(ROOT, "frozen", "icon.png")


# ---------- blocks and armor ----------

def gen_blocks(rng):
    img = Img(16, 16)
    noise_fill(img, rng, (150, 205, 245), 10, 170)
    for i in range(16):
        img.set(i, (i * 3 + 2) % 16, (235, 250, 255, 210))
        img.set((i * 5 + 7) % 16, i, (200, 235, 255, 200))
    img.save(TEX, "block", "magic_ice.png")


def gen_armor(rng):
    armor_dir = os.path.join(ROOT, "minecraft", "textures", "models", "armor")
    for layer in (1, 2):
        img = Img(64, 32)
        noise_fill(img, rng, (160, 215, 245), 14)
        for i in range(0, 64, 5):
            img.set(i, (i * 7) % 32, (240, 252, 255))
        if layer == 1:
            img.rect(9, 11, 6, 2, CLEAR)
        img.save(armor_dir, f"frozen_ice_layer_{layer}.png")


# ---------- humanoid skins (64x64 player layout) ----------

def humanoid(rng, hair, skin, eyes, body, sleeve, legs, shoes, slim, long_hair, extra=None):
    img = Img(64, 64)
    arm_w = 3 if slim else 4

    def head(face, x, y, fw, fh):
        if face == "bottom":
            return skin
        if face in ("top", "back"):
            return jitter(rng, hair, 6)
        if face in ("left", "right"):
            return jitter(rng, hair, 6) if long_hair or y < 3 else skin
        if y < 2:
            return jitter(rng, hair, 6)
        if y == 4 and x in (1, 6):
            return (255, 255, 255, 255)
        if y == 4 and x in (2, 5):
            return eyes
        if y == 6 and x in (3, 4):
            return (190, 100, 100, 255)
        return skin

    def solid(color, amount=6):
        return lambda face, x, y, fw, fh: jitter(rng, color, amount)

    def arm(face, x, y, fw, fh):
        if face == "bottom" or (face != "top" and y >= fh - 2):
            return skin
        return jitter(rng, sleeve, 6)

    def leg(face, x, y, fw, fh):
        if face == "bottom" or (face != "top" and y >= fh - 2):
            return shoes
        return jitter(rng, legs, 6)

    box(img, 0, 0, 8, 8, 8, head)
    box(img, 16, 16, 8, 12, 4, solid(body))
    box(img, 40, 16, arm_w, 12, 4, arm)
    box(img, 32, 48, arm_w, 12, 4, arm)
    box(img, 0, 16, 4, 12, 4, leg)
    box(img, 16, 48, 4, 12, 4, leg)
    if extra:
        extra(img)
    return img


def gen_characters(rng):
    ent = os.path.join(TEX, "entity")

    def elsa_extra(img):
        for y in range(20, 28):
            img.set(21, y, (240, 235, 200))
            img.set(22, y, (225, 220, 185))
        for _ in range(14):
            img.set(rng.randint(20, 27), rng.randint(20, 31), (230, 250, 255))

    humanoid(rng, (240, 235, 200), (250, 225, 210, 255), (60, 140, 220, 255), (140, 200, 235),
             (190, 225, 245), (130, 190, 230), (200, 235, 255), True, True, elsa_extra).save(ent, "elsa.png")

    def anna_extra(img):
        img.rect(20, 25, 8, 1, (230, 190, 60))
        for y in range(8, 16):
            img.set(0, y, (130, 55, 30))
            img.set(23, y, (130, 55, 30))

    humanoid(rng, (160, 70, 40), (250, 220, 200, 255), (60, 120, 90, 255), (40, 40, 50),
             (180, 40, 110), (40, 60, 110), (30, 25, 25), True, True, anna_extra).save(ent, "anna.png")

    def kristoff_extra(img):
        img.rect(20, 28, 8, 1, (100, 70, 40))

    humanoid(rng, (220, 190, 110), (235, 195, 165, 255), (110, 80, 50, 255), (80, 80, 95),
             (80, 80, 95), (60, 45, 35), (40, 30, 25), False, False, kristoff_extra).save(ent, "kristoff.png")


def gen_olaf(rng):
    img = Img(64, 64)
    snow = (245, 248, 252)
    noise_fill(img, rng, snow, 5)
    front = (8, 8)
    for x, y, c in [(2, 3, (20, 20, 20)), (5, 3, (20, 20, 20)), (3, 4, (240, 130, 30)),
                    (4, 4, (240, 130, 30)), (4, 5, (220, 110, 20))]:
        img.set(front[0] + x, front[1] + y, c)
    for x in range(1, 7):
        img.set(front[0] + x, front[1] + 6, (60, 50, 50))
    img.set(front[0] + 3, front[1] + 6, (255, 255, 255))
    img.set(front[0] + 4, front[1] + 6, (255, 255, 255))
    for y in (2, 5, 8):
        img.rect(10 + 4, 26 + y, 2, 1, (30, 30, 30))
    img.rect(32, 0, 28, 4, CLEAR)
    box(img, 32, 0, 12, 2, 2, lambda f, x, y, fw, fh: jitter(rng, (100, 65, 35), 10))
    img.save(TEX, "entity", "olaf.png")


def gen_sven(rng):
    img = Img(64, 64)
    noise_fill(img, rng, (125, 90, 60), 10)
    noise_fill(img, rng, (55, 35, 25), 6, x=0, y=0, w=64, h=13)
    for x, y in [(29, 5), (30, 5), (29, 6), (30, 6)]:
        img.set(x, y, (200, 200, 210))
    noise_fill(img, rng, (80, 55, 40), 6, x=56, y=36, w=8, h=20)
    noise_fill(img, rng, (80, 55, 40), 6, x=42, y=36, w=14, h=20)
    noise_fill(img, rng, (190, 170, 140), 8, x=0, y=25, w=18, h=10)
    noise_fill(img, rng, (50, 40, 35), 4, x=48, y=33, w=16, h=3)
    img.save(TEX, "entity", "sven.png")


def gen_marshmallow(rng):
    img = Img(128, 128)
    noise_fill(img, rng, (235, 245, 252), 8)
    for _ in range(260):
        x, y = rng.randint(0, 127), rng.randint(0, 127)
        img.rect(x, y, 2, 2, jitter(rng, (170, 215, 245), 10))
    for x in (9, 10, 13, 14):
        img.set(x, 12, (30, 90, 200))
    for x in range(9, 15):
        img.set(x, 15 + (x % 2), (40, 60, 90))
    img.save(TEX, "entity", "marshmallow.png")


def main():
    rng = random.Random(1225)
    gen_items()
    gen_blocks(rng)
    gen_armor(rng)
    gen_characters(rng)
    gen_olaf(rng)
    gen_sven(rng)
    gen_marshmallow(rng)
    print("textures written to", os.path.normpath(ROOT))


if __name__ == "__main__":
    main()
