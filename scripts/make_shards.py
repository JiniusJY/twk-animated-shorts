#!/usr/bin/env python3
"""Split durationFrames in out/props.json into N inclusive frame-range shards for parallel CI rendering."""
import json
import math
import sys
from pathlib import Path

props = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
total = int(props["spec"]["durationFrames"])
n = max(1, min(int(sys.argv[2]), total))
step = math.ceil(total / n)

shards = []
for i in range(n):
    a = i * step
    if a >= total:
        break
    b = min(total - 1, (i + 1) * step - 1)
    shards.append({"idx": f"{i:02d}", "range": f"{a}-{b}"})

print(json.dumps(shards))
