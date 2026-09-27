#!/usr/bin/env python3
"""Compiles scripts, runs tests and validation, then zips dist/Frozen.mcaddon. Run from anywhere."""
import os
import subprocess
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
DIST = os.path.join(ROOT, "dist")
PACKS = {"behavior_pack": "Frozen_BP", "resource_pack": "Frozen_RP"}


def run(*cmd):
    print("$", " ".join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)


def main():
    if not os.path.isdir(os.path.join(ROOT, "node_modules")):
        run("npm", "install", "--no-audit", "--no-fund")
    run("npm", "run", "build:scripts")
    run("npm", "test")
    run(sys.executable, os.path.join(HERE, "gen_voices.py"))
    run(sys.executable, os.path.join(HERE, "validate.py"))

    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, "Frozen.mcaddon")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for folder, name in PACKS.items():
            base = os.path.join(ROOT, folder)
            for dirpath, _, files in os.walk(base):
                for f in sorted(files):
                    full = os.path.join(dirpath, f)
                    zf.write(full, os.path.join(name, os.path.relpath(full, base)))
    print(f"built {os.path.relpath(out, ROOT)} ({os.path.getsize(out) // 1024} KB)")
    run(sys.executable, os.path.join(HERE, "gen_world.py"))


if __name__ == "__main__":
    main()
