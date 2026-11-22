#!/usr/bin/env python3
"""A/B voice audition on the free Fish model (zero spend).

Generates two clips of the same episode-2 lines on s2.1-pro-free:
  A_current.mp3    - the shipped ep2 voice config verbatim (direction + beats)
  B_aggressive.mp3 - aggressive S2 bracket cues, pacing shifts, deliberate pauses

Used by .github/workflows/voice-test.yml so the A/B runs where FISH_API_KEY /
FISH_VOICE_ID secrets already live. Local use: set both env vars and run.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

LINES = (
    "Someone may have just broken into the FBI's own crime database. "
    "When a police officer in America runs a plate at a traffic stop, "
    "the answer routinely comes from one FBI system: the National Crime Information Center."
)
MID = (
    "That's the weakness. Over ninety thousand agencies connect to it, "
    "and every connection is a door the FBI can't lock."
)

# A: the shipped ep2 config verbatim (voice.direction + the matching beats).
A_TEXT = (
    "[measured, serious curiosity] [confident and clear] " + LINES + " [serious, restrained urgency] " + MID
)
# B: aggressive cue take - wider emotion vocabulary, a beat of silence, pace shifts.
B_TEXT = (
    "[serious, emphatic] Someone may have just broken into the FBI's own crime database. "
    "[long pause] [curious] When a police officer in America runs a plate at a traffic stop, "
    "[emphatic] the answer routinely comes from one FBI system: [pause] the National Crime Information Center. "
    "[serious] That's the weakness. [whispering] Over ninety thousand agencies connect to it, "
    "[serious, emphatic] and every connection is a door the FBI can't lock."
)

# Take C: research agent's calmer-sampling control - its exact words + cues, temp 0.6.
C_TEXT = (
    "[whispering] Someone may have just broken into the FBI's own crime database. "
    "[confident, quickening] When a police officer in America runs a plate at a traffic stop, "
    "the answer routinely comes from one FBI system. "
    "[emphatic, slower] Twelve million active records. About ten million checks a day. "
    "[long pause] [grave] And it never closes."
)


def synth(text: str, out: Path, api_key: str, voice_id: str, temperature: float, top_p: float) -> None:
    payload = {
        "text": text,
        "reference_id": voice_id,
        "format": "mp3",
        "mp3_bitrate": 192,
        "latency": "normal",
        "temperature": temperature,
        "top_p": top_p,
    }
    req = urllib.request.Request(
        "https://api.fish.audio/v1/tts",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "twk-animated-shorts/voice-ab",
            "model": "s2.1-pro-free",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        out.write_bytes(resp.read())

def main() -> int:
    api_key = os.environ.get("FISH_API_KEY", "").strip()
    voice_id = os.environ.get("FISH_VOICE_ID", "").strip()
    if not api_key or not voice_id:
        print("FISH_API_KEY and FISH_VOICE_ID are required", file=sys.stderr)
        return 2
    take = os.environ.get("TAKE", "all").strip().lower()
    outdir = Path("voice-ab")
    outdir.mkdir(exist_ok=True)
    if take in ("all", "ab"):
        synth(A_TEXT, outdir / "A_current.mp3", api_key, voice_id, 0.8, 0.8)
        print("A_current.mp3 done", flush=True)
        synth(B_TEXT, outdir / "B_aggressive.mp3", api_key, voice_id, 0.9, 0.85)
        print("B_aggressive.mp3 done", flush=True)
    if take in ("all", "c"):
        synth(C_TEXT, outdir / "C_calm_sampling.mp3", api_key, voice_id, 0.6, 0.8)
        print("C_calm_sampling.mp3 done", flush=True)
    if take in ("all", "d"):
        # Confirmation take: B's exact cues at production settings 0.8/0.8.
        synth(B_TEXT, outdir / "D_confirm_0808.mp3", api_key, voice_id, 0.8, 0.8)
        print("D_confirm_0808.mp3 done", flush=True)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
