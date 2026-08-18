#!/usr/bin/env python3
"""Idempotently wire a package.json for a package that ships a skills/ directory:
add the "tanstack-intent" keyword, the "skills" files entry, and the
@tanstack/intent devDependency - as targeted text edits, never a full JSON
rewrite, so tab indentation and key order survive untouched."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

INTENT_VERSION = "0.3.6"


def has_skills_dir(package_dir: Path) -> bool:
    return any((package_dir / "skills").glob("*/SKILL.md"))


def add_array_entry(text: str, key: str, entry: str) -> str:
    pattern = re.compile(rf'"{key}": \[\n((?:\t+".*?",?\n)*)(\t+)\]')
    match = pattern.search(text)
    if match is None:
        return text
    body, indent = match.group(1), match.group(2)
    if f'"{entry}"' in body:
        return text
    item_indent = indent + "\t"
    lines = [line for line in body.splitlines() if line.strip()]
    lines = [
        line if line.rstrip().endswith(",") else f"{line.rstrip()}," for line in lines
    ]
    lines.append(f'{item_indent}"{entry}"')
    new_body = "\n".join(lines) + "\n"
    return (
        text[: match.start()] + f'"{key}": [\n{new_body}{indent}]' + text[match.end() :]
    )


def add_dev_dependency(text: str, name: str, version: str) -> str:
    dep_line = f'"{name}": "{version}"'
    existing = re.search(r'"devDependencies": \{\n(\t+)', text)
    if existing is None:
        # No devDependencies block at all - insert one after "license".
        anchor = re.search(r'(\t"license": "[^"]*",\n)', text)
        if anchor is None:
            return text
        insertion = f'\t"devDependencies": {{\n\t\t{dep_line}\n\t}},\n'
        return text[: anchor.end()] + insertion + text[anchor.end() :]

    indent = existing.group(1)
    block_start = existing.end()
    block_end = text.index(f"\n{indent[:-1]}}}", block_start)
    block = text[block_start:block_end]
    if f'"{name}"' in block:
        return text
    entries = [line.strip().rstrip(",") for line in block.splitlines() if line.strip()]
    entries.append(dep_line)
    entries.sort(key=str.lower)
    new_block = "\n".join(f"{indent}{entry}," for entry in entries[:-1])
    new_block += f"\n{indent}{entries[-1]}"
    return text[:block_start] + new_block + text[block_end:]


def wire(package_dir: Path) -> bool:
    path = package_dir / "package.json"
    original = path.read_text()
    text = original
    text = add_array_entry(text, "keywords", "tanstack-intent")
    text = add_array_entry(text, "files", "skills")
    text = add_dev_dependency(text, "@tanstack/intent", INTENT_VERSION)

    if text != original:
        json.loads(text)  # fail loudly before writing anything broken
        path.write_text(text)
        return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("packages_root")
    args = parser.parse_args()

    root = Path(args.packages_root)
    changed = 0
    for package_dir in sorted(root.iterdir()):
        if not (package_dir / "package.json").exists():
            continue
        if not has_skills_dir(package_dir):
            continue
        if wire(package_dir):
            print(f"wired: {package_dir.name}")
            changed += 1
        else:
            print(f"already wired: {package_dir.name}")

    print(f"{changed} package(s) changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
