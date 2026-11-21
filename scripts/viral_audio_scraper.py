#!/usr/bin/env python3
"""
Scrape viral storytelling/background audios across TikTok, Instagram Reels, and YouTube Shorts
using Bright Data SERP API (mcp_serp) + yt-dlp, saving clean audio files to Google Drive
(zero local SSD bloat, never committed to the public GitHub repo).

Requires BRIGHTDATA_API_KEY in environment or local .env (never commit .env).
"""
import argparse
import json
import os
import re
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = Path.home() / "Library/CloudStorage/GoogleDrive-jinytngoh@gmail.com/My Drive/Reel Studio/viral-audio"

PLATFORM_QUERIES = {
    "tiktok": [
        'site:tiktok.com/music "storytelling" OR "suspense" OR "dramatic" viral sound',
        'site:tiktok.com "zack d films" OR "storytime" background music sound',
    ],
    "instagram": [
        'site:instagram.com/reels/audio viral storytelling OR suspense OR tech background music',
        'site:instagram.com/reel viral background music storytelling 2026',
    ],
    "youtube": [
        'site:youtube.com/shorts viral storytelling background music no copyright',
        'site:youtube.com/watch "viral shorts background music" storytelling suspense playful',
    ],
}


def load_env():
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def brightdata_serp(query: str, api_key: str) -> list[dict]:
    search_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}&num=10&brd_json=1"
    payload = json.dumps({
        "zone": "mcp_serp",
        "url": search_url,
        "format": "raw",
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.brightdata.com/request",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("organic", [])


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:48] or "track"


def guess_mood(title: str) -> str:
    low = title.lower()
    if any(w in low for w in ("suspense", "dark", "mystery", "horror", "creepy", "thriller")):
        return "tense"
    if any(w in low for w in ("march", "epic", "dramatic", "cinematic", "intense")):
        return "march"
    if any(w in low for w in ("mystery", "weird", "curious", "ambient", "chill")):
        return "mystery"
    return "playful"


def is_media_url(url: str) -> bool:
    low = url.lower()
    return any(
        p in low
        for p in (
            "tiktok.com/@",
            "tiktok.com/music/",
            "instagram.com/reel/",
            "youtube.com/watch",
            "youtube.com/shorts/",
            "youtu.be/",
        )
    ) and "/user/" not in low and "/channel/" not in low


def download_audio(url: str, out_base: Path) -> Path | None:
    ytdlp = "/opt/homebrew/bin/yt-dlp"
    if not Path(ytdlp).exists():
        ytdlp = "yt-dlp"
    cmd = [
        ytdlp,
        "--no-playlist",
        "--playlist-items", "1",
        "--max-filesize", "20M",
        "--match-filter", "duration >= 12 & duration <= 240",
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "192K",
        "-o", str(out_base) + ".%(ext)s",
        url,
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
    except subprocess.TimeoutExpired:
        return None
    mp3 = out_base.with_suffix(".mp3")
    if res.returncode == 0 and mp3.exists():
        return mp3
    return None


def cleared_tracks(catalog: list[dict]) -> list[dict]:
    """Only tracks whose rights_status has been upgraded to 'cleared' or
    'licensed' after a real license check may be considered for a mix."""
    return [t for t in catalog if t.get("rights_status") in ("cleared", "licensed")]


def main():
    load_env()
    parser = argparse.ArgumentParser(description="Scrape viral audios via Bright Data across TikTok, IG, and YouTube")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output directory (defaults to Google Drive)")
    parser.add_argument("--limit-per-platform", type=int, default=3, help="Max downloaded tracks per platform")
    parser.add_argument("--dry-run", action="store_true", help="Only search with Bright Data, skip yt-dlp download")
    args = parser.parse_args()

    api_key = os.environ.get("BRIGHTDATA_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("Missing BRIGHTDATA_API_KEY in environment or .env")

    out_dir = Path(args.out).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    catalog_path = out_dir / "catalog.json"
    existing = json.loads(catalog_path.read_text(encoding="utf-8")) if catalog_path.exists() else []
    seen_urls = {item["url"] for item in existing}

    for platform, queries in PLATFORM_QUERIES.items():
        downloaded = 0
        print(f"\n=== Scouting {platform} via Bright Data (mcp_serp) ===", flush=True)
        for q in queries:
            if downloaded >= args.limit_per_platform:
                break
            try:
                hits = brightdata_serp(q, api_key)
            except Exception as exc:
                print(f"SERP error ({platform}): {exc}", flush=True)
                continue

            for hit in hits:
                if downloaded >= args.limit_per_platform:
                    break
                url = hit.get("link", "")
                title = (hit.get("title") or "").strip()
                if not url or url in seen_urls or not is_media_url(url):
                    continue
                if args.dry_run:
                    print(f"[DRY-RUN] {platform}: {title} -> {url}")
                    seen_urls.add(url)
                    downloaded += 1
                    continue

                slug = f"{platform}-{slugify(title)}"
                mp3 = download_audio(url, out_dir / slug)
                if mp3:
                    entry = {
                        "slug": slug,
                        "platform": platform,
                        "title": title,
                        "mood": guess_mood(title + " " + (hit.get("description") or "")),
                        "url": url,
                        "file": str(mp3),
                        # Rights-awareness: scraped sounds are references, not
                        # cleared assets. Nothing here is safe to publish until
                        # rights_status is upgraded after a real license check.
                        "rights_status": "uncleared",
                        "rights_notes": "Scraped viral sound; original artist/license unknown. "
                                        "Do not use in a published video until cleared or replaced "
                                        "with a licensed/original track.",
                        "source_page": url,
                        "scraped_at": __import__("datetime").datetime.now(
                            __import__("datetime").timezone.utc).isoformat(timespec="seconds"),
                    }
                    existing.append(entry)
                    seen_urls.add(url)
                    downloaded += 1
                    catalog_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")
                    print(f"Saved [{platform}] {mp3.name} ({entry['mood']})", flush=True)

    catalog_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    print(f"\nCatalog updated: {catalog_path} ({len(existing)} total tracks)")


if __name__ == "__main__":
    main()
