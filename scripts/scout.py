#!/usr/bin/env python3
"""
Low-token viral story scout.
Fetches rising tech/AI/science/startup stories from Reddit, Hacker News, and Lobste.rs
JSON feeds, deduplicates against src/episodes/history.json, scores for paradox +
visual cause-and-effect potential, and prints a compact Top 8 digest.
"""
import argparse
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HISTORY_FILE = ROOT / "src" / "episodes" / "history.json"
UA = "twk-animated-shorts-scout/1.0 (story research)"

SUBREDDITS = [
    "technology",
    "artificial",
    "todayilearned",
    "programming",
    "singapore",
]

PARADOX_WORDS = {
    "million", "billion", "accidentally", "banned", "impossible", "never",
    "bug", "typo", "deleted", "shutdown", "crashed", "illegal", "secret",
    "trapped", "lost", "hack", "glitch", "ai", "bot", "bots", "lawsuit",
    "broke", "failed", "cost", "worth", "free", "stopped", "shut", "100%",
}


def fetch_json(url: str, timeout: int = 10):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def load_seen() -> set[str]:
    if not HISTORY_FILE.exists():
        return set()
    try:
        data = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        return {item.get("url", "") for item in data} | {item.get("title", "").lower() for item in data}
    except Exception:
        return set()


def score_story(title: str, engagement: int) -> float:
    low = title.lower()
    words = set(re.findall(r"[a-z0-9%$]+", low))
    hook_hits = len(words & PARADOX_WORDS)
    has_number = 1.5 if re.search(r"(\$?\d+[kmb]?|\d+%)", low) else 0.0
    return round((min(engagement, 20000) ** 0.5) * 0.4 + hook_hits * 3.0 + has_number, 2)


def normalize_scores(items: list[dict]) -> list[dict]:
    """Rescale raw scores per source to a 0-100 range so HN, Reddit and
    lobste.rs engagement magnitudes do not swamp each other in the ranking."""
    by_source: dict[str, list[dict]] = {}
    for it in items:
        by_source.setdefault(it["source"], []).append(it)
    for group in by_source.values():
        peak = max((it["score"] for it in group), default=1.0) or 1.0
        for it in group:
            it["source_rank"] = round(100.0 * it["score"] / peak, 1)
    return items


def collect_reddit(limit_per_sub: int = 10) -> list[dict]:
    items = []
    for sub in SUBREDDITS:
        try:
            data = fetch_json(f"https://www.reddit.com/r/{sub}/hot.json?limit={limit_per_sub}")
            for child in data.get("data", {}).get("children", []):
                d = child.get("data", {})
                if d.get("stickied"):
                    continue
                title = (d.get("title") or "").strip()
                eng = int(d.get("score", 0)) + int(d.get("num_comments", 0)) * 2
                items.append({
                    "source": f"r/{sub}",
                    "title": title,
                    "url": d.get("url") or f"https://reddit.com{d.get('permalink', '')}",
                    "discussion": f"https://reddit.com{d.get('permalink', '')}",
                    "engagement": eng,
                    "score": score_story(title, eng),
                })
        except Exception:
            continue
    return items


def collect_hn(limit: int = 25) -> list[dict]:
    items = []
    try:
        ids = fetch_json("https://hacker-news.firebaseio.com/v0/topstories.json")[:limit]
        for sid in ids:
            try:
                d = fetch_json(f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=5)
                if not d or not d.get("title"):
                    continue
                title = d["title"].strip()
                eng = int(d.get("score", 0)) + int(d.get("descendants", 0)) * 2
                items.append({
                    "source": "HN",
                    "title": title,
                    "url": d.get("url") or f"https://news.ycombinator.com/item?id={sid}",
                    "discussion": f"https://news.ycombinator.com/item?id={sid}",
                    "engagement": eng,
                    "score": score_story(title, eng),
                })
            except Exception:
                continue
    except Exception:
        pass
    return items


def collect_lobsters(limit: int = 15) -> list[dict]:
    items = []
    try:
        data = fetch_json("https://lobste.rs/hottest.json")[:limit]
        for d in data:
            title = (d.get("title") or "").strip()
            eng = int(d.get("score", 0)) + int(d.get("comment_count", 0)) * 2
            items.append({
                "source": "lobste.rs",
                "title": title,
                "url": d.get("url") or d.get("short_id_url", ""),
                "discussion": d.get("comments_url") or d.get("short_id_url", ""),
                "engagement": eng,
                "score": score_story(title, eng),
            })
    except Exception:
        pass
    return items


def main():
    parser = argparse.ArgumentParser(description="Scout trending visual stories across tech communities")
    parser.add_argument("--top", type=int, default=8)
    parser.add_argument("--json", action="store_true", help="Output compact JSON")
    args = parser.parse_args()

    seen = load_seen()
    raw = collect_reddit() + collect_hn() + collect_lobsters()
    deduped = []
    seen_titles = set()
    normalize_scores(raw)
    for it in sorted(raw, key=lambda x: (x.get("source_rank", 0.0), x["score"]), reverse=True):
        key = it["title"].lower()
        if key in seen_titles or key in seen or it["url"] in seen:
            continue
        seen_titles.add(key)
        deduped.append(it)

    top = deduped[: args.top]
    if args.json:
        print(json.dumps(top, indent=2))
        return

    print(f"Top {len(top)} viral story candidates:")
    for idx, it in enumerate(top, 1):
        print(f"{idx}. [{it['source']} | rank={it.get('source_rank')} | score={it['score']} | eng={it['engagement']}] {it['title']}")
        print(f"   {it['url']}")


if __name__ == "__main__":
    main()
