#!/usr/bin/env python3
"""BFS from / over internal links and report which sitemap paths sit beyond a click-depth budget."""

from __future__ import annotations

import argparse
import json
import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "_lib"))

from site_tools import fetch, internal_links, sitemap_paths  # noqa: E402


def crawl(base: str, max_depth: int) -> dict[str, int]:
    depth: dict[str, int] = {"/": 0}
    queue: deque[str] = deque(["/"])
    while queue:
        path = queue.popleft()
        here = depth[path]
        if here >= max_depth:
            continue
        _, body = fetch(f"{base}{path}")
        for href in internal_links(body):
            clean = href.split("?")[0]
            if clean not in depth:
                depth[clean] = here + 1
                queue.append(clean)
    return depth


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base")
    parser.add_argument("--max-depth", type=int, default=3)
    args = parser.parse_args()

    depth = crawl(args.base, args.max_depth + 1)
    sitemap = sitemap_paths(args.base)
    beyond = sorted(
        path for path in sitemap if depth.get(path, args.max_depth + 1) > args.max_depth
    )

    print(
        json.dumps(
            {
                "checked": len(sitemap),
                "reachable_within": args.max_depth,
                "beyond_depth": beyond,
            }
        )
    )
    return 0 if not beyond else 1


if __name__ == "__main__":
    sys.exit(main())
