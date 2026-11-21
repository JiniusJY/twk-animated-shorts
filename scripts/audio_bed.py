#!/usr/bin/env python3
"""
Procedural SFX + Music + Voice master mix (-15.0 LUFS, <= -1.2 dBTP)
Reuses templates/audio/dsp.py, instruments.py, and sfx_gen.py driven by episode.json.
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "templates" / "audio"))

from dsp import SR, ns, dbg, rng, read_wav, write_wav, st, place, integrated, true_peak, fades, lp, hp  # noqa: E402
import instruments as I  # noqa: E402
import sfx_gen as S  # noqa: E402


def duck_envelope(n_samples: int, words: list[dict], duck_db: float = -3.5) -> np.ndarray:
    mask = np.zeros(n_samples, dtype=np.float64)
    for w in words:
        s = max(0, ns(float(w["s"]) - 0.08))
        e = min(n_samples, ns(float(w["e"]) + 0.14))
        mask[s:e] = 1.0
    smooth = ndimage.gaussian_filter1d(mask, sigma=SR * 0.08)
    smooth = np.clip(smooth, 0.0, 1.0)
    return dbg(duck_db * smooth)


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


def soft_limit(x: np.ndarray, ceil_db: float = -1.2) -> np.ndarray:
    ceil = dbg(ceil_db)
    peak = float(np.max(np.abs(x)))
    if peak > ceil and peak > 0:
        x = np.tanh(x * (ceil / peak) * 1.1) * ceil / np.tanh(1.1)
    return x


def get_wav_duration(path: Path) -> float:
    x, sr = read_wav(str(path))
    return x.shape[1] / float(sr)


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
    # Match video length to voice + 0.4s breathing room (minimum 15s)
    dur = max(15.0, voice_dur + 0.4)
    synced_frames = int(round(dur * fps))
    if ep.get("shots"):
        scale = synced_frames / max(1, int(ep["durationFrames"]))
        for s in ep["shots"]:
            s["a"] = int(round(s["a"] * scale))
            s["b"] = int(round(s["b"] * scale))
        ep["shots"][-1]["b"] = synced_frames
    ep["durationFrames"] = synced_frames
    n = ns(dur)

    if args.props_out:
        p_out = Path(args.props_out)
        p_out.parent.mkdir(parents=True, exist_ok=True)
        p_out.write_text(json.dumps({"spec": ep}), encoding="utf-8")

    v_raw, sr = read_wav(str(voice_wav))
    if sr != SR:
        raise RuntimeError(f"Expected {SR}Hz voice.wav, got {sr}Hz")
    v_mono = v_raw[0] if v_raw.shape[0] == 1 else v_raw.mean(0)
    voice = np.zeros(n, dtype=np.float64)
    voice[: min(n, len(v_mono))] = v_mono[:n]
    voice_st = st(voice)

    words = json.loads((ep_dir / "voice" / "words.json").read_text(encoding="utf-8"))
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
    mix = voice_st + music + sfx * dbg(-6.0)

    cur_lufs = integrated(mix)
    if np.isfinite(cur_lufs):
        mix *= dbg(-15.0 - cur_lufs)
    mix = soft_limit(mix, -1.2)

    out_dir = ep_dir / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_wav = out_dir / "mix.wav"
    write_wav(str(out_wav), mix, bits=24)
    print(f"Wrote {out_wav} ({dur:.2f}s, integrated={integrated(mix):.1f} LUFS, peak={true_peak(mix):.2f} dBTP)")


if __name__ == "__main__":
    main()
