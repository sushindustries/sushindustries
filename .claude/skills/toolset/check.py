#!/usr/bin/env python3
"""Look up a slug in the live sitemap and report whether real content exists there."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "_lib"))

from site_tools import fetch, sitemap_paths, word_count  # noqa: E402

DEFAULT_MIN_WORDS = 40


def markdown_variant(path: str) -> str:
    # /components and /packages carry a chrome-free Markdown twin under /r/md -
    # cheaper and less noisy to word-count than the full HTML page.
    if path.startswith("/components/"):
        return f"/r/md/{path.removeprefix('/components/')}"
    if path.startswith("/packages/"):
        return f"/r/md/packages/{path.removeprefix('/packages/')}"
    return path


@dataclass(frozen=True)
class Result:
    url: str
    status: int | None
    word_count: int
    verdict: str


def check(url: str, min_words: int) -> Result:
    is_html = "/r/md/" not in url and not url.split("?")[0].endswith(".md")

    try:
        status, body = fetch(url)
    except HTTPError as error:
        return Result(url=url, status=error.code, word_count=0, verdict="not found")
    except URLError as error:
        return Result(
            url=url, status=None, word_count=0, verdict=f"unreachable: {error.reason}"
        )

    count = word_count(body, is_html=is_html)
    verdict = "stub" if count < min_words else "documented"
    return Result(url=url, status=status, word_count=count, verdict=verdict)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base", help="e.g. http://localhost:3000 or the built server")
    parser.add_argument("slug")
    parser.add_argument("--min-words", type=int, default=DEFAULT_MIN_WORDS)
    args = parser.parse_args()

    matches = [path for path in sitemap_paths(args.base) if args.slug in path]
    if not matches:
        print(json.dumps({"slug": args.slug, "verdict": "not in sitemap"}))
        return 1

    results = [
        check(f"{args.base}{markdown_variant(path)}", args.min_words)
        for path in matches
    ]
    print(json.dumps([result.__dict__ for result in results]))
    return 0 if all(result.verdict == "documented" for result in results) else 1


if __name__ == "__main__":
    sys.exit(main())
