#!/usr/bin/env python3
"""Find named exports under a directory that no other file in the repo imports by name."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

EXPORT_PATTERN = re.compile(
    r"^export (?:async )?(?:function|const|class|interface|type)\s+([A-Za-z_][A-Za-z0-9_]*)",
    re.MULTILINE,
)

SKIP_NAMES = {"Route"}  # picked up by file-based routing, not by name imports


def exported_names(path: Path) -> list[str]:
    text = path.read_text()
    return [name for name in EXPORT_PATTERN.findall(text) if name not in SKIP_NAMES]


def used_elsewhere(name: str, defining_file: Path, root: Path) -> bool:
    result = subprocess.run(
        ["grep", "-rl", "-w", name, str(root), "--include=*.ts", "--include=*.tsx"],
        capture_output=True,
        text=True,
        check=False,
    )
    hits = [Path(line) for line in result.stdout.splitlines()]
    return any(hit.resolve() != defining_file.resolve() for hit in hits)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory")
    parser.add_argument("--repo-root", default=".")
    args = parser.parse_args()

    directory = Path(args.directory)
    repo_root = Path(args.repo_root)
    dead: list[str] = []

    for path in sorted(directory.rglob("*.ts")) + sorted(directory.rglob("*.tsx")):
        if path.name.endswith((".test.ts", ".test.tsx", ".gen.ts")):
            continue
        for name in exported_names(path):
            if not used_elsewhere(name, path, repo_root):
                dead.append(f"{path}: {name}")

    for line in dead:
        print(line)
    return 1 if dead else 0


if __name__ == "__main__":
    sys.exit(main())
