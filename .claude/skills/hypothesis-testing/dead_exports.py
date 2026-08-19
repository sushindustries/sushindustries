#!/usr/bin/env python3
"""Find named exports under a directory that no *other* file imports by name.

        python3 .claude/skills/hypothesis-testing/dead_exports.py <directory>

Read the wording precisely, because it is easy to misread a result as wrong.
A name used ten times inside the file that exports it is still reported: the
finding is that the `export` keyword has no consumer, not that the value is
unused. Removing the keyword is then the fix, and deleting the value is not.

It builds one identifier index over the tree and answers every name from it.
The previous version ran `grep` once per exported name - 180 subprocesses for
`apps/web/src/modules` alone, each re-scanning the repository - which took
minutes, and a check nobody waits for is a check nobody runs.

What it cannot see, so treat a finding as a question rather than a verdict:
a name reached through a barrel re-export, by dynamic import, or from a
string. Confirm with the type checker before deleting anything.
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

EXPORT_PATTERN = re.compile(
    r"^export (?:async )?(?:function|const|class|interface|type)\s+([A-Za-z_][A-Za-z0-9_]*)",
    re.MULTILINE,
)

IDENTIFIER = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")

# Picked up by file-based routing, not by a name import.
SKIP_NAMES = {"Route"}

# Nothing here is this repository's own source.
SKIP_DIRECTORIES = {"node_modules", "dist", ".output", ".turbo", ".git", ".nitro"}

SOURCE_SUFFIXES = (".ts", ".tsx")
GENERATED_SUFFIXES = (".test.ts", ".test.tsx", ".gen.ts")


def source_files(root: Path) -> list[Path]:
    """Every TypeScript file in the tree that this repository wrote."""
    found: list[Path] = []
    for path in root.rglob("*"):
        if path.suffix not in SOURCE_SUFFIXES or not path.is_file():
            continue
        if SKIP_DIRECTORIES & set(path.parts):
            continue
        found.append(path)
    return found


def identifier_index(paths: list[Path]) -> dict[str, set[Path]]:
    """Which files mention each identifier, in one pass over the tree."""
    index: dict[str, set[Path]] = defaultdict(set)
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        resolved = path.resolve()
        for identifier in set(IDENTIFIER.findall(text)):
            index[identifier].add(resolved)
    return index


def exported_names(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8", errors="replace")
    return [name for name in EXPORT_PATTERN.findall(text) if name not in SKIP_NAMES]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory")
    parser.add_argument("--repo-root", default=".")
    arguments = parser.parse_args()

    directory = Path(arguments.directory)
    if not directory.is_dir():
        print(f"no such directory: {directory}", file=sys.stderr)
        return 2

    index = identifier_index(source_files(Path(arguments.repo_root)))

    dead: list[str] = []
    for path in sorted(source_files(directory)):
        if path.name.endswith(GENERATED_SUFFIXES):
            continue
        definer = path.resolve()
        for name in exported_names(path):
            if not (index.get(name, set()) - {definer}):
                dead.append(f"{path}: {name}")

    for line in dead:
        print(line)
    if dead:
        summary = "\n".join(
            [
                f"\n{len(dead)} export(s) with no importer outside their own file.",
                "The fix is usually to drop the `export`, not the value.",
                "Check for barrel re-exports and dynamic imports before deleting.",
            ]
        )
        print(summary, file=sys.stderr)
    return 1 if dead else 0


if __name__ == "__main__":
    sys.exit(main())
