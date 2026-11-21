#!/usr/bin/env python3
"""
Procedural SFX + Music + Voice master mix (-15.0 LUFS, <= -1.2 dBTP)
Reuses templates/audio/dsp.py, instruments.py, and sfx_gen.py driven by episode.json.

Timeline sync: every visual timing (shots, keyframes, FX) is scaled from authored
frames to the voice duration — and cue times now scale by the SAME factor, so SFX
stay on their visual beats (previously cues kept their authored seconds and drifted
seconds early on longer voice takes).
"""
import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "templates" / "audio"))

from dsp import SR, ns, dbg, rng, read_wav, write_wav, st, place, integrated, true_peak, fades, lp, hp  # noqa: E402
import instruments as I  # noqa: E402
import sfx_gen as S  # noqa: E402

TARGET_LUFS = -15.0
CEIL_DB = -1.2


def duck_envelope(n_samples: int, words: list[dict], duck_db: float = -3.5) -> np.ndarray:
    mask = np.zeros(n_samples, dtype=np.float64)
    for w in words:
        s = max(0, ns(float(w["s"]) - 0.08))
        e = min(n_samples, ns(float(w["e"]) + 0.14))
        mask[s:e] = 1.0
    smooth = ndimage.gaussian_filter1d(mask, sigma=SR * 0.08)
    smooth = np.clip(smooth, 0.0, 1.0)
    return dbg(duck_db * smooth)


def sync_episode(ep: dict, fps: int, voice_dur: float) -> tuple[dict, float, float]:
    """Scale all authored timings to the voice duration. Returns (ep, dur_seconds, scale).

    Shots, actor/prop keyframes and FX are in FRAMES and scale by `scale`.
    Cues are in SECONDS against the authored script timeline, so they scale by
    the SAME factor — this was the sync bug: cues used to keep authored seconds
    while every visual beat moved.
    """
    dur = max(15.0, voice_dur + 0.4)
    synced_frames = int(round(dur * fps))
    scale = synced_frames / max(1, int(ep["durationFrames"]))
    for s in ep.get("shots", []):
        s["a"] = int(round(s["a"] * scale))
        s["b"] = int(round(s["b"] * scale))
        if "flashAt" in s:
            s["flashAt"] = int(round(s["flashAt"] * scale))
        if "kickAt" in s:
            s["kickAt"] = [int(round(k * scale)) for k in s["kickAt"]]
    if ep.get("shots"):
        ep["shots"][-1]["b"] = synced_frames
    for a in ep.get("actors", []):
        for kf in a.get("keyframes", []):
            kf["f"] = int(round(kf["f"] * scale))
    for p in ep.get("props", []):
        for kf in p.get("keyframes", []):
            kf["f"] = int(round(kf["f"] * scale))
    for fx in ep.get("fx", []):
        fx["a"] = int(round(fx["a"] * scale))
        fx["b"] = int(round(fx["b"] * scale))
    for c in ep.get("cues", []):
        c["t"] = round(float(c["t"]) * scale, 3)
    ep["durationFrames"] = synced_frames
    return ep, dur, scale


def build_music(dur: float, mood: str, seed: int = 42) -> np.ndarray:
    r = rng(seed)
    n = ns(dur)
    buf = np.zeros((2, n), dtype=np.float64)
    bpm = 112 if mood == "march" else 120 if mood == "playful" else 96 if mood == "tense" else 88
    beat = 60.0 / bpm

    # Scale notes (MIDI)
    chords = {
        "march": [[48, 55, 60], [53, 60, 65], [55, 62, 67], [48, 55, 60]],
        "playful": [[60, 64, 67], [65, 69, 72], [62, 65, 69], [67, 71, 74]],
        "tense": [[45, 52, 57], [46, 53, 58], [43, 50, 55], [45, 52, 57]],
        "mystery": [[50, 57, 62], [48, 55, 60], [46, 53, 58], [45, 52, 57]],
    }.get(mood, [[60, 64, 67], [65, 69, 72], [62, 65, 69], [67, 71, 74]])

    t = 0.0
    step = 0
    while t < dur - 0.2:
        ch = chords[(step // 4) % len(chords)]
        if step % 4 == 0:
            freqs = [I.m2f(m) for m in ch]
            p = I.pad(freqs, dur=beat * 3.9, vel=0.35, r=r, att=0.25, rel=0.5, warm=800.0)
            place(buf, st(p), t, gain=0.45)
        # Bass/pluck pulse
        bass_m = ch[0] - 12 if step % 2 == 0 else ch[1] - 12
        pl = I.pluck(I.m2f(bass_m), vel=0.65, r=r, dur=0.45, bright=0.35)
        place(buf, st(pl), t, gain=0.42)
        if mood in ("march", "playful") and step % 2 == 1:
            br = I.brush(vel=0.35, r=r, dur=0.22, swish=True)
            place(buf, st(br), t, gain=0.28)
        if mood == "tense" and step % 4 == 2:
            tp = I.timpani(I.m2f(ch[0] - 12), vel=0.5, r=r, dur=0.8)
            place(buf, st(tp), t, gain=0.35)
        t += beat
        step += 1

    buf = hp(buf, 55.0)
    buf = lp(buf, 7500.0)
    return fades(buf, 0.05, 0.25)


def synth_cue(kind: str, r) -> np.ndarray:
    if kind == "whoosh":
        return S.whoosh(0.28, r, peak=0.4, f_lo=300, f_hi=2400)
    if kind == "pop":
        return S.clink(r, f0=920.0, dur=0.09, bright=1.1)
    if kind == "cash":
        a = S.clink(r, f0=1560.0, dur=0.14, bright=1.3)
        b = I.glock(I.m2f(84), vel=0.6, r=r, dur=0.55)
        out = np.zeros(max(len(a), len(b) + ns(0.06)))
        out[: len(a)] += a * 0.6
        out[ns(0.06) : ns(0.06) + len(b)] += b * 0.55
        return out
    if kind == "boom":
        return I.timpani(68.0, vel=0.95, r=r, dur=1.2)
    if kind == "snap":
        return S.bolt_snap(r)
    if kind == "flash":
        a = I.cymbal(vel=0.55, r=r, dur=0.9, bright=1.2) * 0.45
        b = S.whoosh(0.22, r, peak=0.35)
        out = np.zeros(max(len(a), len(b)))
        out[: len(a)] += a
        out[: len(b)] += b
        return out
    if kind == "chime":
        return I.vibes(I.m2f(76), vel=0.65, r=r, dur=0.9)
    if kind == "tick":
        return S.boot(r, hard=0.6)
    return S.clink(r, f0=700.0, dur=0.08)


def build_sfx(dur: float, cues: list[dict], seed: int = 99) -> np.ndarray:
    r = rng(seed)
    buf = np.zeros((2, ns(dur)), dtype=np.float64)
    for c in cues:
        t = float(c.get("t", 0.0))
        if 0.0 <= t < dur:
            snd = synth_cue(c.get("kind", "pop"), r)
            place(buf, st(snd), t, gain=float(c.get("gain", 0.55)))
    return buf


def lookahead_limiter(x: np.ndarray, ceil_db: float = CEIL_DB, lookahead_ms: float = 5.0, release_ms: float = 80.0) -> np.ndarray:
    """Stereo-linked lookahead peak limiter.

    Unlike the old soft_limit(), one loud SFX peak only turns down its own
    neighbourhood instead of rescaling the ENTIRE mix around the global max
    (which dragged every speech section down ~9 LU and made the final master
    miss its -15 LUFS target by a mile).
    """
    ceil = dbg(ceil_db)
    env = np.max(np.abs(x), axis=0)  # linked gain so the stereo image never wanders
    hop = 64
    nblk = (len(env) + hop - 1) // hop
    pad = nblk * hop - len(env)
    b = np.max(np.pad(env, (0, pad), constant_values=0).reshape(nblk, hop), axis=1)
    # gain needed per block so no sample in the block exceeds the ceiling
    g = np.minimum(1.0, ceil / np.maximum(b, 1e-9))
    la = max(1, ns(lookahead_ms / 1000) // hop)
    g = ndimage.minimum_filter1d(g, size=2 * la + 1, mode="nearest")  # lookahead: gain dips before the peak
    rel = max(1.0, ns(release_ms / 1000) / hop)
    g = ndimage.gaussian_filter1d(g, sigma=rel / 4, mode="nearest")  # smooth release, no pumping clicks
    g = np.minimum(g, np.minimum(1.0, ceil / np.maximum(b, 1e-9)))  # never above the required dip
    up = np.repeat(g, hop)[: len(env)]
    return x * up


def normalize_and_limit(mix: np.ndarray, target_lufs: float = TARGET_LUFS, ceil_db: float = CEIL_DB) -> np.ndarray:
    """Two-pass integrated loudness normalization + true-peak-safe limiting."""
    cur = integrated(mix)
    if np.isfinite(cur):
        mix = mix * dbg(target_lufs - cur)
    mix = lookahead_limiter(mix, ceil_db)
    # Pass 2: limiting cost some integrated loudness — make it up once, then re-limit
    post = integrated(mix)
    if np.isfinite(post) and abs(post - target_lufs) > 0.3:
        mix = lookahead_limiter(mix * dbg(target_lufs - post), ceil_db)
    ceil = dbg(ceil_db)
    return np.clip(mix, -ceil, ceil)


def get_wav_duration(path: Path) -> float:
    x, sr = read_wav(str(path))
    return x.shape[1] / float(sr)


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git_sha() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], text=True, cwd=ROOT).strip()
    except Exception:
        return "unknown"


def load_bg_audio(src: Path, dur: float) -> np.ndarray:
    n = ns(dur)
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "bg.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-stream_loop", "-1", "-i", str(src), "-t", f"{dur:.3f}", "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s24le", str(wav)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        raw, _ = read_wav(str(wav))
    out = np.zeros((2, n), dtype=np.float64)
    k = min(n, raw.shape[1])
    out[:, :k] = raw[:, :k]
    return fades(out, 0.05, 0.25)


def main():
    parser = argparse.ArgumentParser(description="Build procedural audio mix for episode")
    parser.add_argument("--episode", required=True)
    parser.add_argument("--props-out", default="", help="Optional path to write Remotion props JSON synced to voice duration")
    parser.add_argument("--bg-audio", default="", help="Optional path to scraped viral audio track")
    args = parser.parse_args()

    ep_dir = Path(args.episode).resolve()
    ep = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
    fps = int(ep.get("fps", 30))

    voice_wav = ep_dir / "voice" / "voice.wav"
    voice_dur = get_wav_duration(voice_wav)
    ep, dur, scale = sync_episode(ep, fps, voice_dur)
    print(f"Timeline sync: voice {voice_dur:.2f}s -> {ep['durationFrames']} frames at {fps}fps (scale {scale:.4f}, cues scaled too)", flush=True)
    n = ns(dur)

    words = json.loads((ep_dir / "voice" / "words.json").read_text(encoding="utf-8"))
    words_meta_path = ep_dir / "voice" / "words_meta.json"
    words_meta = json.loads(words_meta_path.read_text(encoding="utf-8")) if words_meta_path.exists() else {}
    captions_approximate = bool(words_meta.get("approximate", False))
    if captions_approximate:
        print("WARNING: word timings are the APPROXIMATE proportional fallback, not real alignment.", flush=True)

    if args.props_out:
        p_out = Path(args.props_out)
        p_out.parent.mkdir(parents=True, exist_ok=True)
        p_out.write_text(json.dumps({"spec": ep, "captions": words, "captionsApproximate": captions_approximate}), encoding="utf-8")

    v_raw, sr = read_wav(str(voice_wav))
    if sr != SR:
        raise RuntimeError(f"Expected {SR}Hz voice.wav, got {sr}Hz")
    v_mono = v_raw[0] if v_raw.shape[0] == 1 else v_raw.mean(0)
    voice = np.zeros(n, dtype=np.float64)
    voice[: min(n, len(v_mono))] = v_mono[:n]
    voice_st = st(voice)
    # Level the voice stem before mixing so SFX peaks never drag speech down later
    v_lufs = integrated(voice_st)
    if np.isfinite(v_lufs):
        voice_st = voice_st * dbg(-17.0 - v_lufs)

    bg_path = Path(args.bg_audio).expanduser() if args.bg_audio else (Path(ep["bgAudio"]).expanduser() if ep.get("bgAudio") else None)
    if bg_path and bg_path.exists():
        print(f"Using viral background track: {bg_path.name}", flush=True)
        music = load_bg_audio(bg_path, dur)
    else:
        music = build_music(dur, ep.get("musicMood", "playful"))
    music *= duck_envelope(n, words, duck_db=-4.0)

    # Set music bed ~10.5 dB below voice
    v_lufs = integrated(voice_st)
    m_lufs = integrated(music)
    if np.isfinite(v_lufs) and np.isfinite(m_lufs):
        music *= dbg((v_lufs - 10.5) - m_lufs)

    sfx = build_sfx(dur, ep.get("cues", []))
    # Trim SFX stem so one loud cue cannot own the limiter
    sfx_peak = float(np.max(np.abs(sfx))) if sfx.size else 0.0
    if sfx_peak > 0.5:
        sfx = sfx * (0.5 / sfx_peak)

    mix = voice_st + music + sfx * dbg(-6.0)
    mix = normalize_and_limit(mix, TARGET_LUFS, CEIL_DB)

    out_dir = ep_dir / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_wav = out_dir / "mix.wav"
    write_wav(str(out_wav), mix, bits=24)

    # Stems for remixing without re-running the whole pipeline
    write_wav(str(out_dir / "stem_voice.wav"), voice_st, bits=24)
    write_wav(str(out_dir / "stem_music.wav"), music, bits=24)
    write_wav(str(out_dir / "stem_sfx.wav"), sfx, bits=24)

    final_lufs = integrated(mix)
    final_peak = true_peak(mix)
    manifest = {
        "episode": ep.get("slug", ep_dir.name),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "code_sha": git_sha(),
        "episode_json_sha256": sha256_file(ep_dir / "episode.json"),
        "voice_wav_sha256": sha256_file(voice_wav),
        "words_sha256": sha256_file(ep_dir / "voice" / "words.json"),
        "alignment": {"method": words_meta.get("method", "unknown"), "approximate": captions_approximate},
        "voice_provider": words_meta.get("provider", "unknown"),
        "voice_model": words_meta.get("model", "unknown"),
        "timeline": {"fps": fps, "duration_frames": ep["durationFrames"], "duration_sec": round(dur, 3), "scale": round(scale, 6)},
        "mix": {
            "target_lufs": TARGET_LUFS,
            "integrated_lufs": round(float(final_lufs), 2),
            "true_peak_dbtp": round(float(final_peak), 2),
            "ceil_db": CEIL_DB,
            "seed_music": 42,
            "seed_sfx": 99,
        },
        "bg_audio": str(bg_path) if bg_path and bg_path.exists() else None,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {out_wav} ({dur:.2f}s, integrated={final_lufs:.1f} LUFS, peak={final_peak:.2f} dBTP) + stems + manifest.json")


if __name__ == "__main__":
    main()
