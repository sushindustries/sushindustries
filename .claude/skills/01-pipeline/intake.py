#!/usr/bin/env python3
"""Stage 01, intake: is one named thing wired into every place the later
stages read it from?

        python3 .claude/skills/01-pipeline/intake.py <slug> [--json]

Everything in this repo is content-defined: no index to update, the site globs
the source. That makes exactly one failure mode possible at intake, and it is
invisible in a diff - a thing exists in some of its link points and not the
others, so the page renders half of it and no single file looks wrong.

This reads those link points and prints which are joined, which are not, and
the one command that joins each. It never writes. `pnpm run doctor --fix` is the
thing that repairs, and it can only repair what it can copy from somewhere
else, so the actions below are split accordingly.

It is not a second doctor. The doctor checks every rule across the whole repo
and only sees a component once the registry knows about it. This traces one
slug, including a slug the registry has never heard of, which is the state a
half-finished thing is actually in.

Exit codes: 0 the contract is met, 1 a required link is missing, 2 no such
slug anywhere.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Link:
    """One place a slug has to appear, and what to run when it does not."""

    name: str
    path: str
    present: bool
    required: bool
    action: str


def repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "pnpm-workspace.yaml").exists():
            return parent
    sys.exit("not inside the sushindustries repo")


def reads(root: Path, relative: str) -> str:
    path = root / relative
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def frontmatter(body: str, field: str) -> str:
    match = re.search(rf"^{field}:\s*(.*)$", body, re.MULTILINE)
    return match.group(1).strip() if match else ""


def owner_package(root: Path, slug: str) -> tuple[str, str] | None:
    """Which package holds `<slug>.tsx` or `<slug>.ts`, and which extension."""
    for source in sorted(root.glob(f"packages/*/src/{slug}.ts*")):
        return source.parent.parent.name, source.suffix
    return None


def detect_kind(root: Path, slug: str) -> str | None:
    if owner_package(root, slug):
        return "component"
    if f'name: "{slug}"' in reads(root, "packages/ui/registry.ts"):
        return "component"
    if (root / "packages" / slug / "package.json").is_file():
        return "package"
    if (root / "apps/web/content/posts" / f"{slug}.md").is_file():
        return "post"
    if (root / "apps/web/content/pages" / f"{slug}.md").is_file():
        return "page"
    return None


def component_links(root: Path, slug: str) -> list[Link]:
    owner = owner_package(root, slug)
    package, extension = owner if owner else ("ui", ".tsx")
    source = f"packages/{package}/src/{slug}{extension}"
    barrel = f"packages/{package}/src/index.ts"
    registry = f"packages/{package}/registry.ts"
    docs = f"packages/{package}/docs/{slug}/index.md"
    demos = "apps/web/src/modules/showcase/demos.tsx"
    return [
        Link(
            "source",
            source,
            owner is not None,
            True,
            f"pnpm new component {slug}",
        ),
        Link(
            "export",
            barrel,
            f'from "./{slug}"' in reads(root, barrel),
            True,
            f'export it from {barrel}: export {{ ... }} from "./{slug}"',
        ),
        Link(
            "registry",
            registry,
            f'name: "{slug}"' in reads(root, registry),
            True,
            f"add the entry to {registry} - it is the only link that gates the page",
        ),
        Link(
            "docs summary",
            docs,
            bool(frontmatter(reads(root, docs), "summary")),
            False,
            f"pnpm run docs --slug {slug}, then write the summary frontmatter",
        ),
        Link(
            "demo",
            demos,
            f'"{slug}":' in reads(root, demos),
            False,
            f"add a demo keyed {slug} to {demos}",
        ),
    ]


def package_links(root: Path, slug: str) -> list[Link]:
    manifest = f"packages/{slug}/package.json"
    body = reads(root, manifest)
    manifest_fields: dict[str, object] = json.loads(body) if body else {}
    description = str(manifest_fields.get("description", ""))
    return [
        Link("manifest", manifest, bool(body), True, f"pnpm new package {slug}"),
        Link(
            "description",
            manifest,
            bool(description),
            True,
            f'write "description" in {manifest} - the site renders it',
        ),
        Link(
            "readme",
            f"packages/{slug}/README.md",
            (root / "packages" / slug / "README.md").is_file(),
            True,
            f"write packages/{slug}/README.md - the package page is this file",
        ),
        Link(
            "dockerfile",
            "Dockerfile",
            f"packages/{slug}/package.json" in reads(root, "Dockerfile"),
            True,
            "pnpm run doctor --fix",
        ),
    ]


def content_links(root: Path, slug: str, kind: str) -> list[Link]:
    relative = f"apps/web/content/{kind}s/{slug}.md"
    body = reads(root, relative)
    return [
        Link("file", relative, bool(body), True, f"pnpm new {kind} {slug}"),
        Link(
            "title",
            relative,
            bool(frontmatter(body, "title")),
            True,
            f"write title frontmatter in {relative}",
        ),
        Link(
            "summary",
            relative,
            bool(frontmatter(body, "summary")),
            True,
            f"write summary frontmatter in {relative} - the catalogue reads it",
        ),
        Link(
            "published",
            relative,
            frontmatter(body, "draft") != "true",
            False,
            f"remove draft: true from {relative} when it is ready to be listed",
        ),
    ]


def links_for(root: Path, slug: str, kind: str) -> list[Link]:
    if kind == "component":
        return component_links(root, slug)
    if kind == "package":
        return package_links(root, slug)
    return content_links(root, slug, kind)


def report(slug: str, kind: str, links: list[Link]) -> None:
    blocked = [link for link in links if link.required and not link.present]
    print(f"\n  {slug}  ({kind})\n")
    for link in links:
        mark = "ok  " if link.present else ("MISS" if link.required else "----")
        suffix = "" if link.required else "  (optional)"
        print(f"  {mark}  {link.name:<14} {link.path}{suffix}")
        if not link.present:
            print(f"          -> {link.action}")
    if blocked:
        names = ", ".join(link.name for link in blocked)
        print(f"\n  stage 01 intake: BLOCKED on {names}")
        print("  do the actions above in order, then run this again.\n")
    else:
        print("\n  stage 01 intake: PASSED")
        print("  next: stage 02, see .claude/skills/01-pipeline/SKILL.md\n")


def main() -> int:
    arguments = [argument for argument in sys.argv[1:] if not argument.startswith("--")]
    if not arguments:
        return int(bool(sys.stderr.write(f"{__doc__}\n")))
    slug = arguments[0]
    root = repo_root()
    kind = detect_kind(root, slug)
    if kind is None:
        print(f"\n  {slug}: nothing by that name exists yet.")
        print("  start it: pnpm new <post|page|component|package> " + slug + "\n")
        return 2
    links = links_for(root, slug, kind)
    if "--json" in sys.argv:
        print(
            json.dumps(
                {"slug": slug, "kind": kind, "links": [vars(l) for l in links]},
                indent=2,
            )
        )
    else:
        report(slug, kind, links)
    return 1 if any(link.required and not link.present for link in links) else 0


if __name__ == "__main__":
    sys.exit(main())
