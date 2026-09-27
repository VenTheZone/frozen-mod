#!/usr/bin/env python3
"""Records a voice clip for every line of dialogue with edge-tts (Microsoft neural voices, needs internet).

Only missing clips are recorded, clips for lines that no longer exist are deleted, and
resource_pack/sounds/sound_definitions.json is rewritten. Requires: pip install edge-tts, ffmpeg.
"""
import asyncio
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
SOUNDS = os.path.join(ROOT, "resource_pack", "sounds")
VOICE_DIR = os.path.join(SOUNDS, "voice")
PARALLEL = 6

# npc -> list of (voice, rate, pitch). Several entries = the line picks one by its id (townsfolk).
VOICES = {
    "anna": [("en-US-JennyNeural", "+10%", "+4Hz")],
    "elsa": [("en-GB-SoniaNeural", "-5%", "+0Hz")],
    "kristoff": [("en-US-GuyNeural", "+0%", "-4Hz")],
    "olaf": [("en-US-AnaNeural", "+5%", "+0Hz")],
    "hans": [("en-GB-RyanNeural", "+0%", "+0Hz")],
    "duke": [("en-GB-ThomasNeural", "+12%", "+12Hz")],
    "oaken": [("en-US-RogerNeural", "-5%", "-8Hz")],
    "kai": [("en-IE-ConnorNeural", "-5%", "+0Hz")],
    "gerda": [("en-GB-LibbyNeural", "-5%", "-4Hz")],
    "pabbie": [("en-US-ChristopherNeural", "-15%", "-15Hz")],
    "troll": [("en-AU-WilliamMultilingualNeural", "+10%", "-10Hz")],
    "guard": [("en-US-EricNeural", "+0%", "-2Hz")],
    "townsfolk": [("en-CA-ClaraNeural", "+0%", "+0Hz"), ("en-CA-LiamNeural", "+0%", "+0Hz")],
}


def lines():
    out = subprocess.run(["node", os.path.join(HERE, "voice_lines.ts")], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(out.stdout)


def clip_path(sound_id):
    return os.path.join(VOICE_DIR, sound_id.rsplit(".", 1)[1] + ".ogg")


async def record(line, gate):
    import edge_tts

    choices = VOICES[line["who"]]
    voice, rate, pitch = choices[int(line["id"].rsplit(".", 1)[1], 16) % len(choices)]
    async with gate:
        with tempfile.NamedTemporaryFile(suffix=".mp3") as mp3:
            await edge_tts.Communicate(line["text"], voice, rate=rate, pitch=pitch).save(mp3.name)
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", mp3.name, "-ac", "1", "-ar", "22050",
                 "-c:a", "libvorbis", "-q:a", "1", clip_path(line["id"])],
                check=True,
            )
    print(f"  {line['who']}: {line['text'][:60]}")


async def main():
    all_lines = lines()
    unknown = sorted({l["who"] for l in all_lines} - VOICES.keys())
    if unknown:
        sys.exit(f"no voice cast for: {', '.join(unknown)}")
    os.makedirs(VOICE_DIR, exist_ok=True)

    wanted = {os.path.basename(clip_path(l["id"])) for l in all_lines}
    for f in os.listdir(VOICE_DIR):
        if f not in wanted:
            os.remove(os.path.join(VOICE_DIR, f))
    todo = [l for l in all_lines if not os.path.exists(clip_path(l["id"]))]
    print(f"voices: {len(all_lines)} lines, recording {len(todo)}")
    gate = asyncio.Semaphore(PARALLEL)
    await asyncio.gather(*(record(l, gate) for l in todo))

    definitions = {
        l["id"]: {"category": "player", "sounds": [{"name": f"sounds/voice/{l['id'].rsplit('.', 1)[1]}", "is3D": False, "volume": 1.0}]}
        for l in sorted(all_lines, key=lambda l: l["id"])
    }
    with open(os.path.join(SOUNDS, "sound_definitions.json"), "w") as f:
        json.dump({"format_version": "1.20.20", "sound_definitions": definitions}, f, indent=1)
        f.write("\n")


if __name__ == "__main__":
    asyncio.run(main())
