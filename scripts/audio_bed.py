#!/usr/bin/env python3
"""
Procedural SFX + Music + Voice master mix (-15.0 LUFS, <= -1.6 dBTP sample peak, headroom for intersample true peak)
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
from editorial import narration_warp
import sfx_gen as S  # noqa: E402

TARGET_LUFS = -15.0
CEIL_DB = -2.2  # sample-peak ceiling; leaves ~1.2dB headroom for lossy (AAC) intersample overshoot so the muxed QA true-peak stays under -1.0 dBTP


OUTRO_EXTRA_DB = -8.0  # extra drop under the end card, on top of the speech duck
OUTRO_FADE_S = 1.2     # final fade to silence


def outro_span(words: list[dict], dur: float) -> list[dict]:
    """A pseudo-word covering everything after the last spoken word, so ducking holds."""
    if not words:
        return []
    last = max(float(w["e"]) for w in words)
    return [{"w": "<outro>", "s": last, "e": dur}] if dur > last else []


def outro_envelope(n_samples: int, words: list[dict], dur: float) -> np.ndarray:
    """Gain curve: 1.0 while speaking; after the last word glide down OUTRO_EXTRA_DB, then fade out."""
    env = np.ones(n_samples, dtype=np.float64)
    if not words:
        return env
    a = min(n_samples, ns(max(float(w["e"]) for w in words) + 0.15))
    tail = n_samples - a
    if tail <= 1:
        return env
    glide = min(tail, ns(1.5))
    env[a:a + glide] = dbg(np.linspace(0.0, OUTRO_EXTRA_DB, glide))
    env[a + glide:] = dbg(OUTRO_EXTRA_DB)
    f = min(tail, ns(OUTRO_FADE_S))
    env[n_samples - f:] *= np.linspace(1.0, 0.0, f) ** 2
    return env


def duck_envelope(n_samples: int, words: list[dict], duck_db: float = -3.5) -> np.ndarray:
    mask = np.zeros(n_samples, dtype=np.float64)
    for w in words:
        s = max(0, ns(float(w["s"]) - 0.08))
        e = min(n_samples, ns(float(w["e"]) + 0.14))
        mask[s:e] = 1.0
    smooth = ndimage.gaussian_filter1d(mask, sigma=SR * 0.08)
    smooth = np.clip(smooth, 0.0, 1.0)
    return dbg(duck_db * smooth)


def sync_episode(ep: dict, fps: int, voice_dur: float, words=None) -> tuple[dict, float, float]:
    """Narration anchors drive cuts. The same piecewise map drives every event."""
    dur = max(15.0, voice_dur + 0.4)
    original = int(ep["durationFrames"])
    total = round(dur * fps)
    content_total = total
    card_seconds = float(ep.get("endCard", {}).get("seconds", 2.0)) if ep.get("endCard") else 0
    scale = total / max(1, original)
    anchored = any(s.get("anchor") for s in ep.get("shots", []))
    if anchored and not words:
        raise ValueError("Anchored episode requires real word timings")
    warp, points = narration_warp(ep, fps, dur, words) if anchored else (lambda f: round(f*scale), [])
    for shot in ep.get("shots", []):
        shot["a"], shot["b"] = warp(shot["a"]), warp(shot["b"])
        for key in ["flashAt"]:
            if key in shot: shot[key] = warp(shot[key])
        if "kickAt" in shot: shot["kickAt"] = [warp(f) for f in shot["kickAt"]]
    if ep.get("shots"): ep["shots"][-1]["b"] = total
    for owner in ep.get("actors", []) + ep.get("props", []):
        for k in owner.get("keyframes", []):
            old = k["f"]
            action = k.get("action", {})
            if "dur" in action: action["dur"] = max(1, warp(old+action["dur"])-warp(old))
            k["f"] = warp(old)
    for fx in ep.get("fx", []):
        fx["a"], fx["b"] = warp(fx["a"]), warp(fx["b"])
    for cue in ep.get("cues", []):
        cue["t"] = round(warp(float(cue["t"])*fps)/fps if anchored else float(cue["t"])*scale, 3)
    if card_seconds:
        total += round(card_seconds*fps)
        dur += card_seconds
        ep["shots"][-1]["b"] = total
        ep.setdefault("cues", []).append({"t": content_total/fps+0.1, "kind": "chime", "gain": 0.22})
    ep["durationFrames"] = total
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
    if kind in ("riser", "powerdown", "startup", "relay"):
        dur = {"riser": 0.8, "powerdown": 0.6, "startup": 0.45, "relay": 0.07}[kind]
        t = np.arange(ns(dur)) / SR
        if kind == "relay":
            return fades(r.normal(0, 0.14, len(t)) * np.exp(-t*70), 0.001, 0.02)
        f0, f1 = {"riser": (120, 1400), "powerdown": (800, 45), "startup": (160, 900)}[kind]
        phase = 2*np.pi*(f0*t+(f1-f0)*t*t/(2*dur))
        envelope = (t/dur)**1.6 if kind == "riser" else np.exp(-t*4)
        return fades((np.sin(phase)*0.22 + np.sin(phase*2.01)*0.06)*envelope, 0.008, 0.05)
    if kind == "punch":
        # Punch-in transition: short airy whoosh into a soft low impact.
        a = S.whoosh(0.16, r, peak=0.34, f_lo=500, f_hi=3200, tail=0.10)
        b = I.timpani(72.0, vel=0.5, r=r, dur=0.5)
        out = np.zeros(max(len(a), len(b) + ns(0.09)))
        out[: len(a)] += a
        out[ns(0.09) : ns(0.09) + len(b)] += b * 0.8
        return out
    if kind == "thud":
        # Stamp slam: low body + paper smack.
        a = I.timpani(55.0, vel=0.9, r=r, dur=0.7)
        b = fades(r.normal(0, 0.5, ns(0.05)) * np.exp(-np.arange(ns(0.05)) / SR * 90), 0.002, 0.02)
        out = np.zeros(max(len(a), len(b)))
        out[: len(a)] += a
        out[: len(b)] += b
        return out
    if kind == "clack":
        # Drawer/drum-tile pop: bright mechanical tick.
        a = S.clink(r, f0=1320.0, dur=0.05, bright=1.2)
        b = S.boot(r, hard=0.35)
        out = np.zeros(max(len(a), len(b)))
        out[: len(a)] += a * 0.8
        out[: len(b)] += b * 0.5
        return out
    if kind == "alarm":
        # Two-tone alert pulse for the breach beat.
        dur = 0.7
        t = np.arange(ns(dur)) / SR
        f0 = np.where(t % 0.35 < 0.175, 660.0, 520.0)
        phase = 2 * np.pi * np.cumsum(f0) / SR
        env = np.minimum(1.0, t / 0.02) * np.exp(-t * 2.2)
        return fades(np.sin(phase) * 0.18 * env, 0.005, 0.1)
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
            pan = float(c.get("pan", 0.0))
            stereo = np.stack([snd * np.cos((pan+1)*np.pi/4), snd * np.sin((pan+1)*np.pi/4)])
            place(buf, stereo, t, gain=float(c.get("gain", 0.55)))
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


def loop_crossfade(raw: np.ndarray, dur: float, xfade_s: float = 1.5) -> np.ndarray:
    """Tile a short track to dur with equal-power crossfades at every seam.

    Owner rule (22 Nov 2026): music must never end before the clip or restart
    audibly - loop joins crossfade, the only hard fade is the outro fade.
    """
    n = ns(dur)
    src_n = raw.shape[1]
    if src_n >= n:
        return raw[:, :n]
    x = min(ns(xfade_s), src_n // 2)
    if x <= 0:
        return np.tile(raw, (1, int(np.ceil(n / src_n))))[:, :n]
    fin = np.sin(0.5 * np.pi * np.linspace(0, 1, x)) ** 2
    fout = np.cos(0.5 * np.pi * np.linspace(0, 1, x)) ** 2
    out = np.zeros((2, n), dtype=np.float64)
    adv = src_n - x
    t = 0
    first = True
    while t < n:
        seg = raw[:, : min(src_n, n - t)]
        L = seg.shape[1]
        if first:
            out[:, :L] += seg
            first = False
        else:
            k = min(x, L, n - t)
            out[:, t:t + k] = out[:, t:t + k] * fout[:k] + seg[:, :k] * fin[:k]
            if L > k:
                out[:, t + k:t + L] += seg[:, k:]
        t += adv
    return out


def load_bg_audio(src: Path, dur: float) -> np.ndarray:
    n = ns(dur)
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "bg.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(src), "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s24le", str(wav)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        raw, _ = read_wav(str(wav))
    return fades(loop_crossfade(raw, dur), 0.05, 0.25)


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
    words = json.loads((ep_dir / "voice" / "words.json").read_text(encoding="utf-8"))
    meta_file = ep_dir / "voice" / "words_meta.json"
    meta_early = json.loads(meta_file.read_text()) if meta_file.exists() else {}
    if meta_early.get("approximate") and any(s.get("anchor") for s in ep.get("shots", [])):
        raise ValueError("Editorial anchors require real alignment, not approximate word timing")
    ep, dur, scale = sync_episode(ep, fps, voice_dur, words)
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
        # MUSIC RULE root fix (owner, 22 Nov 2026: "music wasn't updated"):
        # the fixed seed 42 made every episode with the same mood ship the
        # SAME bed (boeing + ncic both 'tense'). Derive the seed from the
        # episode directory so no two episodes ever share a bed.
        music_seed = int(hashlib.sha256(ep_dir.name.encode("utf-8")).hexdigest()[:8], 16) % (2**31)
        music = build_music(dur, ep.get("musicMood", "playful"), seed=music_seed)
    # OUTRO RULE root fix (owner, 22 Nov 2026: "final music towards the end was too loud"):
    # ducking used to follow speech only, so after the last word the bed released to full level
    # for the whole end card (only a 0.25s fade at the very end). Now the outro is treated as
    # speech for ducking (the bed never swells up when the voice stops), then glides a further
    # OUTRO_EXTRA_DB down under the end card and fades out smoothly over OUTRO_FADE_S.
    music *= duck_envelope(n, words + outro_span(words, dur), duck_db=-4.0)
    music *= outro_envelope(n, words, dur)

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

    # Deliberate contrast: drop music just before critical cues, then release.
    for cue in ep.get("cues", []):
        if cue.get("kind") == "powerdown":
            a, b = max(0, ns(cue["t"]-0.22)), min(n, ns(cue["t"]+0.45))
            length = b-a
            if length > 1:
                ramp = max(1, min(ns(0.025), length//2))
                env = np.full(length, 0.06)
                env[:ramp] = np.linspace(1, 0.06, ramp)
                env[-ramp:] = np.linspace(0.06, 1, ramp)
                music[:, a:b] *= env
    mix = voice_st + music + sfx * duck_envelope(n, words, duck_db=-2.5) * dbg(-6.0)
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
            "seed_music": music_seed if not (bg_path and bg_path.exists()) else None,
            "seed_sfx": 99,
        },
        "bg_audio": str(bg_path) if bg_path and bg_path.exists() else None,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {out_wav} ({dur:.2f}s, integrated={final_lufs:.1f} LUFS, peak={final_peak:.2f} dBTP) + stems + manifest.json")


if __name__ == "__main__":
    main()
