#!/usr/bin/env python3
"""
Cloud TTS + Cloud Word Alignment (zero local AI models).
Primary: Fish Audio (FISH_API_KEY + FISH_VOICE_ID) -> voice.wav
         Groq Whisper (GROQ_API_KEY) -> words.json
Fallback (if secrets are missing): Edge-TTS (free cloud voice + built-in word timings).
"""
import argparse
import asyncio
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path


def run_ffmpeg_to_wav(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", str(dst)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def synth_fish_audio(text: str, out_mp3: Path, api_key: str, voice_id: str):
    payload = json.dumps({
        "text": text,
        "reference_id": voice_id,
        "format": "mp3",
        "mp3_bitrate": 192,
        "latency": "normal",
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.fish.audio/v1/tts",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        out_mp3.write_bytes(resp.read())


def align_groq_whisper(audio_path: Path, api_key: str) -> list[dict]:
    import mimetypes

    boundary = "----TWKBoundary7MA4YWxkTrZu0gW"
    ctype = mimetypes.guess_type(str(audio_path))[0] or "audio/mpeg"
    parts = []

    def add_field(name: str, value: str):
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode("utf-8")
        )

    add_field("model", "whisper-large-v3-turbo")
    add_field("response_format", "verbose_json")
    add_field("timestamp_granularities[]", "word")
    add_field("language", "en")

    file_head = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"{audio_path.name}\"\r\n"
        f"Content-Type: {ctype}\r\n\r\n"
    ).encode("utf-8")
    parts.append(file_head + audio_path.read_bytes() + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body = b"".join(parts)

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    words = []
    for w in data.get("words", []):
        txt = (w.get("word") or "").strip()
        if txt:
            words.append({
                "w": txt,
                "s": round(float(w["start"]), 3),
                "e": round(float(w["end"]), 3),
            })
    return words


async def synth_edge_tts(text: str, out_mp3: Path, voice: str = "en-US-AndrewMultilingualNeural", rate: str = "+8%"):
    import edge_tts

    comm = edge_tts.Communicate(text, voice=voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(out_mp3, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                s = chunk["offset"] / 10_000_000.0
                d = chunk["duration"] / 10_000_000.0
                words.append({"w": chunk["text"], "s": round(s, 3), "e": round(s + d, 3)})
    return words


def fallback_even_words(text: str, wav_path: Path) -> list[dict]:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(wav_path)],
        text=True,
    ).strip()
    dur = float(out)
    tokens = text.split()
    if not tokens:
        return []
    step = dur / len(tokens)
    return [{"w": t, "s": round(i * step, 3), "e": round((i + 1) * step, 3)} for i, t in enumerate(tokens)]


def main():
    parser = argparse.ArgumentParser(description="Generate cloud voiceover and word timings")
    parser.add_argument("--episode", required=True, help="Episode directory path")
    args = parser.parse_args()

    ep_dir = Path(args.episode).resolve()
    ep_json = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
    script = ep_json.get("script") or (ep_dir / "script.txt").read_text(encoding="utf-8")
    script = " ".join(script.split())

    voice_dir = ep_dir / "voice"
    voice_dir.mkdir(parents=True, exist_ok=True)
    wav_path = voice_dir / "voice.wav"
    words_path = voice_dir / "words.json"

    fish_key = os.environ.get("FISH_API_KEY", "").strip()
    fish_voice = os.environ.get("FISH_VOICE_ID", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()

    with tempfile.TemporaryDirectory() as tmp:
        mp3_path = Path(tmp) / "raw.mp3"
        words: list[dict] = []

        if fish_key and fish_voice:
            print("Using Fish Audio TTS...", flush=True)
            synth_fish_audio(script, mp3_path, fish_key, fish_voice)
            run_ffmpeg_to_wav(mp3_path, wav_path)
            if groq_key:
                print("Aligning word timings with Groq Whisper...", flush=True)
                words = align_groq_whisper(mp3_path, groq_key)
            else:
                print("GROQ_API_KEY not set; falling back to proportional word timings.", flush=True)
                words = fallback_even_words(script, wav_path)
        else:
            print("FISH_API_KEY/FISH_VOICE_ID not set; using Edge-TTS cloud fallback...", flush=True)
            words = asyncio.run(synth_edge_tts(script, mp3_path))
            run_ffmpeg_to_wav(mp3_path, wav_path)
            if groq_key:
                print("Refining word timings with Groq Whisper...", flush=True)
                words = align_groq_whisper(mp3_path, groq_key)

    words_path.write_text(json.dumps(words, indent=2), encoding="utf-8")
    print(f"Wrote {wav_path} and {len(words)} words to {words_path}")


if __name__ == "__main__":
    main()
