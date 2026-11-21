#!/usr/bin/env python3
"""Split durationFrames in out/props.json into N inclusive frame-range shards for parallel CI rendering."""
import json
import math
import sys
from pathlib import Path


def compute_shards(total: int, n: int) -> list[dict]:
    """Inclusive [a, b] frame ranges covering [0, total) exactly once: no gaps, no overlaps."""
    total = int(total)
    if total < 1:
        raise ValueError(f"total frames must be >= 1, got {total}")
    n = max(1, min(int(n), total))
    step = math.ceil(total / n)
    shards = []
    for i in range(n):
        a = i * step
        if a >= total:
            break
        b = min(total - 1, (i + 1) * step - 1)
        shards.append({"idx": f"{i:02d}", "range": f"{a}-{b}", "a": a, "b": b})
    return shards


def main():
    props = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    total = int(props["spec"]["durationFrames"])
    n = int(sys.argv[2])
    shards = compute_shards(total, n)
    print(json.dumps([{"idx": s["idx"], "range": s["range"]} for s in shards]))


if __name__ == "__main__":
    main()
