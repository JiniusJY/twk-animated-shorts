#!/usr/bin/env python3
"""
Cloud TTS + Cloud Word Alignment (zero local AI models).

Primary: free-only Fish Audio (FISH_API_KEY + FISH_VOICE_ID) -> voice.wav
         Groq Whisper (GROQ_API_KEY) -> words.json
Fallback (if secrets are missing): Edge-TTS (free cloud voice + built-in word timings).

Expressiveness (Fish S2, the production model per https://docs.fish.audio/developer-guide/models-pricing/models-overview):
- episode.json "voice": {"temperature": 0.8, "topP": 0.8, "speed": 1.0}
- S2 [bracket] emotion cues in the script text, e.g. "[excited] ...", "[whispering] ..."
  S2 does NOT interpret S1 (parenthesis) cues; this script converts known (paren) cues
  to [bracket] when an S2 model is used; concise natural-language directions are supported.

Caching: voice + alignment are reused while the script and voice params are unchanged
(hash in voice/voice_manifest.json). --force regenerates. This keeps render retries
comparable (same take) and avoids repeating paid API calls.
"""
import argparse
import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# Fish S2 emotion/style cues (bracket syntax). Subset of the documented 64+; unknown
# cues are stripped so they are never read aloud.
MODEL_ORDER = ("s2.1-pro-free",)  # Hard free-only policy. Never fall through to paid/legacy.
VOICE_PIPELINE_VERSION = "directed-free-v3"

S2_CUES = {
    "happy", "sad", "angry", "excited", "calm", "whispering", "shouting", "laughing",
    "crying", "curious", "surprised", "sarcastic", "serious", "fearful", "disgusted",
    "emphatic", "pause", "long pause", "sigh", "breath",
}
PAREN_TO_BRACKET = re.compile(r"\(([a-zA-Z ]{2,24})\)")
BRACKET_CUE = re.compile(r"\[([^]\n]{1,160})\]")


def normalize_cues(text: str, model: str) -> str:
    """Match S2 cue syntax; fallback voices receive plain speech only."""
    def clean_bracket(m: re.Match) -> str:
        cue = m.group(1).strip().lower()
        return f"[{cue}]" if re.fullmatch(r"[a-zA-Z ,.-]{2,120}", cue) else ""

    if model.startswith("s2"):
        # convert known S1 (paren) cues to S2 [bracket] cues
        def paren(m: re.Match) -> str:
            cue = m.group(1).strip().lower()
            return f"[{cue}]" if cue in S2_CUES else m.group(0)

        text = PAREN_TO_BRACKET.sub(paren, text)
        return BRACKET_CUE.sub(clean_bracket, text)
    # S1/edge: strip [bracket] cues entirely (S1 would read them literally)
    return strip_cues(text)


def direct_script(text: str, cfg: dict) -> str:
    """Direction remains out of display/captions. Anchors must occur exactly once."""
    edits = []
    for beat in cfg.get("beats", []):
        phrase, direction = beat["before"], beat["direction"]
        if text.count(phrase) != 1:
            raise ValueError(f"Voice direction anchor must occur once: {phrase!r}")
        if not re.fullmatch(r"[a-zA-Z ,.-]{2,120}", direction):
            raise ValueError("Invalid voice direction")
        edits.append((text.index(phrase), f"[{direction}] "))
    for at, cue in sorted(edits, reverse=True):
        text = text[:at] + cue + text[at:]
    direction = cfg.get("direction", "")
    if direction:
        if not re.fullmatch(r"[a-zA-Z ,.-]{2,120}", direction):
            raise ValueError("Invalid voice direction")
        text = f"[{direction}] " + text
    return text


def run_ffmpeg_to_wav(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", str(dst)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def synth_fish_audio(text: str, out_mp3: Path, api_key: str, voice_id: str, voice_cfg: dict) -> tuple[str, str]:
    """Returns (provider, model_used). Free-only; model errors stop rather than incur a charge."""
    text = direct_script(text, voice_cfg)
    payload_base = {
        "text": text,
        "reference_id": voice_id,
        "format": "mp3",
        "mp3_bitrate": 192,
        "latency": "normal",
        "temperature": float(voice_cfg.get("temperature", 0.8)),
        "top_p": float(voice_cfg.get("topP", 0.8)),
    }
    speed = float(voice_cfg.get("speed", 1.0))
    if speed != 1.0:
        payload_base["prosody"] = {"speed": speed}

    last_exc: Exception | None = None
    for model_hdr in MODEL_ORDER:
        payload = dict(payload_base)
        payload["text"] = normalize_cues(text, model_hdr)
        req = urllib.request.Request(
            "https://api.fish.audio/v1/tts",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "twk-animated-shorts/2.0",
                "model": model_hdr,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                out_mp3.write_bytes(resp.read())
                print(f"Fish Audio synthesized using model={model_hdr}", flush=True)
                return "fish-audio", model_hdr
        except urllib.error.HTTPError as exc:
            last_exc = exc
            if exc.code == 402:
                raise RuntimeError("Free Fish model unavailable for this plan; paid fallback is disabled") from exc
            raise
    raise RuntimeError(f"All Fish Audio models failed: {last_exc}")


def align_groq_whisper(audio_path: Path, api_key: str) -> list[dict]:
    raw = subprocess.check_output(
        [
            "curl", "-sS", "-f", "-X", "POST",
            "https://api.groq.com/openai/v1/audio/transcriptions",
            "-H", f"Authorization: Bearer {api_key}",
            "-F", f"file=@{audio_path}",
            "-F", "model=whisper-large-v3-turbo",
            "-F", "response_format=verbose_json",
            "-F", "timestamp_granularities[]=word",
            "-F", "language=en",
        ],
        text=True,
        timeout=90,
    )
    data = json.loads(raw)

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
    """APPROXIMATE proportional timings — NOT word alignment. Only used when no
    real aligner is available; recorded as approximate in words_meta.json and the
    mix manifest so nobody mistakes it for precision timing."""
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


ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
        "seventeen", "eighteen", "nineteen"]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
NUM_WORDS = set(ONES) | set(TENS) | {"hundred", "thousand", "million", "billion"}


def int_to_words(n: int) -> str:
    """Spoken form without 'and' (matches whisper's usual style): 248 -> two hundred forty eight."""
    if n < 0:
        return "minus " + int_to_words(-n)
    if n < 20:
        return ONES[n]
    if n < 100:
        return (TENS[n // 10] + (" " + ONES[n % 10] if n % 10 else "")).strip()
    if n < 1000:
        rest = int_to_words(n % 100)
        return (ONES[n // 100] + " hundred" + (" " + rest if n % 100 else "")).strip()
    for scale, name in ((1_000_000_000, "billion"), (1_000_000, "million"), (1000, "thousand")):
        if n >= scale:
            rest = n % scale
            return (int_to_words(n // scale) + " " + name + (" " + int_to_words(rest) if rest else "")).strip()
    return str(n)


def expand_tokens(tokens: list[str]) -> list[str]:
    """Expand digit tokens into spoken words, and drop 'and' between number words
    (whisper says 'two hundred AND forty eight'). Applied to BOTH streams."""
    out: list[str] = []
    for t in tokens:
        if re.fullmatch(r"\d+", t):
            out.extend(int_to_words(int(t)).split())
        elif t == "and" and out and out[-1] in NUM_WORDS:
            continue
        else:
            out.append(t)
    return out


def norm_token(t: str) -> str:
    return re.sub(r"[^a-z0-9']", "", t.lower())


def strip_cues(text: str) -> str:
    """Remove S2 [bracket] and S1 (paren) cue markup — for validation and hashing-for-display, never for synth."""
    text = BRACKET_CUE.sub("", text)
    text = PAREN_TO_BRACKET.sub("", text)
    return " ".join(text.split())


def validate_alignment(script: str, words: list[dict], wav_path: Path) -> list[str]:
    """Check transcript-vs-script fidelity and timing coverage. Returns problems.

    Fidelity uses order-aware sequence similarity (difflib) plus bag-of-words
    overlap on number-normalized tokens - a positional zip cascades one inserted
    word into a total mismatch, and whisper spells numbers as words. Small
    timestamp inversions (<0.25s, a known whisper quirk) are clamped in place,
    not failed."""
    import difflib
    from collections import Counter

    problems: list[str] = []
    if not words:
        return ["no words produced by the aligner"]
    script_tokens = expand_tokens([norm_token(t) for t in strip_cues(script).split() if norm_token(t)])
    word_tokens = expand_tokens([norm_token(w["w"]) for w in words if norm_token(w["w"])])
    if script_tokens and word_tokens:
        seq_ratio = difflib.SequenceMatcher(None, script_tokens, word_tokens).ratio()
        overlap = sum((Counter(script_tokens) & Counter(word_tokens)).values()) / max(len(script_tokens), len(word_tokens))
        if seq_ratio < 0.6:
            problems.append(f"transcript/script sequence match {seq_ratio:.0%} < 60%")
        if overlap < 0.65:
            problems.append(f"transcript/script word overlap {overlap:.0%} < 65%")
        # cue words must never be spoken aloud
        spoken_cues = [t for t in word_tokens[:4] if t in S2_CUES and t not in script_tokens]
        if spoken_cues:
            problems.append(f"cue word(s) spoken aloud at the start: {spoken_cues}")
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(wav_path)],
        text=True,
    ).strip()
    dur = float(out)
    coverage = words[-1]["e"] / dur if dur > 0 else 0.0
    if coverage < 0.6:
        problems.append(f"alignment covers {coverage:.0%} of the audio (< 60%)")
    clamped = 0
    for i in range(1, len(words)):
        if words[i]["s"] < words[i - 1]["s"]:
            gap = words[i - 1]["s"] - words[i]["s"]
            if gap > 0.25 and not (gap <= 1.0 and words[i]["e"] > words[i - 1]["e"]):
                problems.append(f"word timings out of order at index {i} (>{gap:.2f}s back)")
                break
            # whisper segment-boundary quirk: window shifted left but end is still past
            # the previous word's end, so speaking order is intact - clamp to prev end.
            words[i]["s"] = words[i - 1]["e"]
            words[i]["e"] = max(words[i]["e"], words[i]["s"])
            clamped += 1
    if clamped:
        print(f"note: clamped {clamped} timestamp inversion(s) (window-shifted, order intact)", flush=True)
    return problems


def script_hash(script: str, voice_id: str, voice_cfg: dict, aligner: str) -> str:
    h = hashlib.sha256()
    h.update(VOICE_PIPELINE_VERSION.encode())
    h.update(repr(MODEL_ORDER).encode())
    h.update(script.encode("utf-8"))
    h.update(voice_id.encode("utf-8"))
    h.update(json.dumps(voice_cfg, sort_keys=True).encode("utf-8"))
    h.update(aligner.encode("utf-8"))
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser(description="Generate cloud voiceover and word timings")
    parser.add_argument("--episode", required=True, help="Episode directory path")
    parser.add_argument("--force", action="store_true", help="Regenerate even if the cached take matches")
    args = parser.parse_args()

    ep_dir = Path(args.episode).resolve()
    ep_json = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
    script = ep_json.get("script") or (ep_dir / "script.txt").read_text(encoding="utf-8")
    script = " ".join(script.split())
    voice_cfg = ep_json.get("voice", {}) or {}

    voice_dir = ep_dir / "voice"
    voice_dir.mkdir(parents=True, exist_ok=True)
    wav_path = voice_dir / "voice.wav"
    words_path = voice_dir / "words.json"
    manifest_path = voice_dir / "voice_manifest.json"

    fish_key = os.environ.get("FISH_API_KEY", "").strip()
    fish_voice = os.environ.get("FISH_VOICE_ID", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    aligner = "groq-whisper" if groq_key else ("edge-tts" if not (fish_key and fish_voice) else "proportional-fallback")

    want = script_hash(script, fish_voice or "edge", voice_cfg, aligner)
    if not args.force and manifest_path.exists() and wav_path.exists() and words_path.exists():
        try:
            old = json.loads(manifest_path.read_text(encoding="utf-8"))
            if old.get("script_hash") == want:
                print(f"Reusing cached voice take (script+voice unchanged, hash {want[:12]}...)", flush=True)
                return
        except Exception:
            pass

    with tempfile.TemporaryDirectory() as tmp:
        mp3_path = Path(tmp) / "raw.mp3"
        words: list[dict] = []
        provider, model, method, approximate = "unknown", "unknown", "unknown", False

        if fish_key and fish_voice:
            print("Using Fish Audio TTS...", flush=True)
            provider, model = synth_fish_audio(script, mp3_path, fish_key, fish_voice, voice_cfg)
            run_ffmpeg_to_wav(mp3_path, wav_path)
            if groq_key:
                print("Aligning word timings with Groq Whisper...", flush=True)
                for attempt in range(3):
                    words = align_groq_whisper(mp3_path, groq_key)
                    # Preserve evidence even on failure; never silently clamp a large jump.
                    (voice_dir / "alignment_raw.json").write_text(json.dumps(words, indent=2))
                    issues = validate_alignment(script, words, wav_path)
                    if not issues: break
                    print(f"Alignment attempt {attempt+1} rejected: {issues}", flush=True)
                method = "groq-whisper"
            else:
                print("GROQ_API_KEY not set; falling back to APPROXIMATE proportional word timings (not real alignment).", flush=True)
                words = fallback_even_words(strip_cues(script), wav_path)
                method = "proportional-fallback"
                approximate = True
        else:
            print("FISH_API_KEY/FISH_VOICE_ID not set; using Edge-TTS cloud fallback...", flush=True)
            provider, model = "edge-tts", "en-US-AndrewMultilingualNeural"
            clean = normalize_cues(script, "edge")
            words = asyncio.run(synth_edge_tts(clean, mp3_path))
            run_ffmpeg_to_wav(mp3_path, wav_path)
            method = "edge-tts"
            if groq_key:
                print("Refining word timings with Groq Whisper...", flush=True)
                for attempt in range(3):
                    words = align_groq_whisper(mp3_path, groq_key)
                    # Preserve evidence even on failure; never silently clamp a large jump.
                    (voice_dir / "alignment_raw.json").write_text(json.dumps(words, indent=2))
                    issues = validate_alignment(script, words, wav_path)
                    if not issues: break
                    print(f"Alignment attempt {attempt+1} rejected: {issues}", flush=True)
                method = "groq-whisper"

    words_path.write_text(json.dumps(words, indent=2), encoding="utf-8")
    problems = validate_alignment(script, words, wav_path)
    if problems:
        print("ALIGNMENT VALIDATION FAILED: " + "; ".join(problems), file=sys.stderr, flush=True)
        sys.exit(1)

    words_path.write_text(json.dumps(words, indent=2), encoding="utf-8")
    meta = {
        "provider": provider,
        "model": model,
        "method": method,
        "approximate": approximate,
        "script_hash": want,
        "voice_cfg": voice_cfg,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "word_count": len(words),
    }
    (voice_dir / "words_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    manifest_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"Wrote {wav_path} and {len(words)} words to {words_path} (method={method}, approximate={approximate})")


if __name__ == "__main__":
    main()
