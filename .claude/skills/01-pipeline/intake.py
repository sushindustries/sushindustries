#!/usr/bin/env python3
"""Stage 01, intake: is one named thing wired into every place the later
stages read it from?

        python3 .claude/skills/01-pipeline/intake.py <slug> [--json]

Everything in this repo is content-defined: no index to update, the site globs
the source. That makes exactly one failure mode possible at intake, and it is
invisible in a diff - a thing exists in some of its link points and not the
others, so the page renders half of it and no single file looks wrong.

This reads those link points and prints which are joined, which are not, and
the one command that joins each. It never writes. `pnpm run doctor --fix` is
the thing that repairs, and it can only repair what it can copy from
somewhere else, so the actions below are split accordingly.

It is not a second doctor. The doctor checks every rule across the whole repo
and only sees a component once the registry knows about it. This traces one
slug, including a slug the registry has never heard of, which is the state a
half-finished thing is actually in.

The interface is one call. `trace(root, slug)` answers what the thing is,
where it should appear, and what is missing. Everything below it is private:
which file extension a hook uses, which package owns a component, how a
frontmatter key is parsed. A caller that had to ask for the kind, hand it
back, and then filter the list itself would be doing this module's work in
three steps that can each be got wrong.

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


@dataclass
class Trace:
    """What one slug is, and every link point it owes.

    `kind` is None when nothing by that name exists anywhere, which is a
    different answer from "exists but is unfinished" and is why callers get
    it rather than an empty list.
    """

    slug: str
    kind: str | None
    links: list[Link]

    @property
    def exists(self) -> bool:
        return self.kind is not None

    @property
    def missing(self) -> list[Link]:
        """The required links that are not joined. Optional ones never block."""
        return [link for link in self.links if link.required and not link.present]

    @property
    def passed(self) -> bool:
        return self.exists and not self.missing

    def docs_home(self, root: Path) -> Path | None:
        """The docs home for a component, if it has one.

        Here rather than in the caller: finding it means knowing which package
        owns the slug, which is exactly the detail this module exists to hold.
        """
        if self.kind != "component":
            return None
        owner = _owner_package(root, self.slug)
        package = owner[0] if owner else "ui"
        path = root / f"packages/{package}/docs/{self.slug}/index.md"
        return path if path.is_file() else None


def repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "pnpm-workspace.yaml").exists():
            return parent
    sys.exit("not inside the sushindustries repo")


def trace(root: Path, slug: str) -> Trace:
    """The one entry point: what this slug is and what it is missing."""
    kind = _detect_kind(root, slug)
    if kind is None:
        return Trace(slug, None, [])
    if kind == "component":
        return Trace(slug, kind, _component_links(root, slug))
    if kind == "package":
        return Trace(slug, kind, _package_links(root, slug))
    return Trace(slug, kind, _content_links(root, slug, kind))


def _reads(root: Path, relative: str) -> str:
    path = root / relative
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _frontmatter(body: str, field: str) -> str:
    """The value of one frontmatter key, or "" when absent or empty.

    `[ \\t]*` rather than `\\s*`: `\\s` spans newlines, so an empty `summary:`
    swallowed the line break and captured the `---` that closes the block. An
    empty field then read as present, which is the exact false pass this gate
    exists to prevent.
    """
    match = re.search(rf"^{re.escape(field)}:[ \t]*(.*)$", body, re.MULTILINE)
    return match.group(1).strip() if match else ""


def _owner_package(root: Path, slug: str) -> tuple[str, str] | None:
    """Which package holds `<slug>.tsx` or `<slug>.ts`, and which extension."""
    for source in sorted(root.glob(f"packages/*/src/{slug}.ts*")):
        return source.parent.parent.name, source.suffix
    return None


def _detect_kind(root: Path, slug: str) -> str | None:
    if _owner_package(root, slug):
        return "component"
    if f'name: "{slug}"' in _reads(root, "packages/ui/registry.ts"):
        return "component"
    if (root / "packages" / slug / "package.json").is_file():
        return "package"
    if (root / "apps/web/content/posts" / f"{slug}.md").is_file():
        return "post"
    if (root / "apps/web/content/pages" / f"{slug}.md").is_file():
        return "page"
    return None


def _component_links(root: Path, slug: str) -> list[Link]:
    owner = _owner_package(root, slug)
    package, extension = owner if owner else ("ui", ".tsx")
    source = f"packages/{package}/src/{slug}{extension}"
    barrel = f"packages/{package}/src/index.ts"
    registry = f"packages/{package}/registry.ts"
    docs = f"packages/{package}/docs/{slug}/index.md"
    demos = "apps/web/src/modules/showcase/demos.tsx"
    return [
        Link("source", source, owner is not None, True, f"pnpm new component {slug}"),
        Link(
            "export",
            barrel,
            f'from "./{slug}"' in _reads(root, barrel),
            True,
            f'export it from {barrel}: export {{ ... }} from "./{slug}"',
        ),
        Link(
            "registry",
            registry,
            f'name: "{slug}"' in _reads(root, registry),
            True,
            f"add the entry to {registry} - it is the only link that gates the page",
        ),
        Link(
            "docs summary",
            docs,
            bool(_frontmatter(_reads(root, docs), "summary")),
            False,
            f"pnpm run docs --slug {slug}, then write the summary frontmatter",
        ),
        Link(
            "demo",
            demos,
            f'"{slug}":' in _reads(root, demos),
            False,
            f"add a demo keyed {slug} to {demos}",
        ),
    ]


def _package_links(root: Path, slug: str) -> list[Link]:
    manifest = f"packages/{slug}/package.json"
    body = _reads(root, manifest)
    fields: dict[str, object] = json.loads(body) if body else {}
    description = str(fields.get("description", ""))
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
            f"packages/{slug}/package.json" in _reads(root, "Dockerfile"),
            True,
            "pnpm run doctor --fix",
        ),
    ]


def _content_links(root: Path, slug: str, kind: str) -> list[Link]:
    relative = f"apps/web/content/{kind}s/{slug}.md"
    body = _reads(root, relative)
    return [
        Link("file", relative, bool(body), True, f"pnpm new {kind} {slug}"),
        Link(
            "title",
            relative,
            bool(_frontmatter(body, "title")),
            True,
            f"write title frontmatter in {relative}",
        ),
        Link(
            "summary",
            relative,
            bool(_frontmatter(body, "summary")),
            True,
            f"write summary frontmatter in {relative} - the catalogue reads it",
        ),
        Link(
            "published",
            relative,
            _frontmatter(body, "draft") != "true",
            False,
            f"remove draft: true from {relative} when it is ready to be listed",
        ),
    ]


def report(traced: Trace) -> None:
    print(f"\n  {traced.slug}  ({traced.kind})\n")
    for link in traced.links:
        mark = "ok  " if link.present else ("MISS" if link.required else "----")
        suffix = "" if link.required else "  (optional)"
        print(f"  {mark}  {link.name:<14} {link.path}{suffix}")
        if not link.present:
            print(f"          -> {link.action}")
    if traced.missing:
        names = ", ".join(link.name for link in traced.missing)
        print(f"\n  stage 01 intake: BLOCKED on {names}")
        print("  do the actions above in order, then run this again.\n")
    else:
        print("\n  stage 01 intake: PASSED")
        print("  next: stage 02, see .claude/skills/01-pipeline/SKILL.md\n")


def main() -> int:
    arguments = [argument for argument in sys.argv[1:] if not argument.startswith("--")]
    if not arguments:
        sys.stderr.write(f"{__doc__}\n")
        return 2
    traced = trace(repo_root(), arguments[0])
    if not traced.exists:
        print(f"\n  {traced.slug}: nothing by that name exists yet.")
        print(f"  start it: pnpm new <post|page|component|package> {traced.slug}\n")
        return 2
    if "--json" in sys.argv:
        print(
            json.dumps(
                {
                    "slug": traced.slug,
                    "kind": traced.kind,
                    "links": [vars(link) for link in traced.links],
                },
                indent=2,
            )
        )
    else:
        report(traced)
    return 1 if traced.missing else 0


if __name__ == "__main__":
    sys.exit(main())
