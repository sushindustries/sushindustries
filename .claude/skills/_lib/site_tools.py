"""Shared helpers for this repo's skill scripts: fetch a URL, read its visible
text, list its internal links, and list every path the live sitemap carries."""

from __future__ import annotations

import re
from html.parser import HTMLParser
from urllib.request import urlopen

NOT_PAGES = ("/preview/", "/r/", "/api/", "/agent-setup", "/health")


class _VisibleText(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.skipping = False
        self.words: list[str] = []
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ("script", "style"):
            self.skipping = True
        if tag == "a":
            href = dict(attrs).get("href")
            if href and href.startswith("/"):
                self.hrefs.append(href.split("#")[0])

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style"):
            self.skipping = False

    def handle_data(self, data: str) -> None:
        if not self.skipping:
            self.words.extend(data.split())


def fetch(url: str, timeout: int = 10) -> tuple[int, str]:
    with urlopen(url, timeout=timeout) as response:
        return response.status, response.read().decode("utf-8", errors="replace")


def word_count(body: str, *, is_html: bool) -> int:
    if not is_html:
        return len(body.split())
    return len(_parsed(body).words)


def _parsed(body: str) -> _VisibleText:
    extractor = _VisibleText()
    extractor.feed(body)
    return extractor


def internal_links(body: str) -> list[str]:
    return [href for href in _parsed(body).hrefs if not href.startswith(NOT_PAGES)]


def sitemap_paths(base: str) -> list[str]:
    _, body = fetch(f"{base}/sitemap.xml")
    locations = re.findall(r"<loc>([^<]+)</loc>", body)
    return [location.removeprefix(base) for location in locations]
