#!/usr/bin/env python3
"""Read and write one section of a hypothesis record, without touching the rest of the file."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

RECORDS_DIR = Path(".claude/hypothesis-testing/records")

# section key -> (heading text, allows repeated bullet lines)
SECTIONS: dict[str, tuple[str, bool]] = {
    "hypothesis": ("Hypothesis", False),
    "constraints": ("Constraints", True),
    "observations": ("Expected observations", True),
    "assertions": ("Assertions", True),
    "evidence": ("Evidence", True),
    "result": ("Validation Result", False),
}

EVIDENCE_KINDS = ("file", "commit", "diff", "document")
RESULTS = ("PASSED", "FAILED", "INCONCLUSIVE")

TEMPLATE = """## Hypothesis

TODO

## Assumptions

### Constraints

TODO

## Predictions

### Expected observations

TODO

## Validation Tests

### Assertions

TODO

## Evidence

TODO

## Validation Result

TODO
"""


def record_path(slug: str) -> Path:
    return RECORDS_DIR / f"{slug}.md"


def create(slug: str) -> Path:
    RECORDS_DIR.mkdir(parents=True, exist_ok=True)
    path = record_path(slug)
    if not path.exists():
        path.write_text(f"# {slug}\n\n{TEMPLATE}")
    return path


def read(slug: str) -> str:
    path = record_path(slug)
    if not path.exists():
        raise SystemExit(f"no record for '{slug}' - run 'new' first")
    return path.read_text()


def last_block(text: str) -> tuple[str, str]:
    # Iterations append a new "# Iteration N" block below the last one, so
    # every read/write acts on whichever block is last - never an earlier one.
    starts = [match.start() for match in re.finditer(r"^# .+$", text, re.M)]
    start = starts[-1]
    return text[:start], text[start:]


def section_pattern(heading: str) -> re.Pattern[str]:
    return re.compile(
        rf"(^#{{2,3}}[ \t]+{re.escape(heading)}[ \t]*$\n+)(.*?)(?=\n#{{1,3}}[ \t]|\Z)",
        re.M | re.S,
    )


def section_body(block: str, heading: str) -> str:
    match = section_pattern(heading).search(block)
    if match is None:
        raise SystemExit(f"no '{heading}' section in this record")
    return match.group(2).strip()


def replace_section(block: str, heading: str, body: str) -> str:
    return section_pattern(heading).sub(
        lambda match: match.group(1) + body + "\n", block
    )


def write_section(slug: str, key: str, body: str) -> None:
    heading, _ = SECTIONS[key]
    path = record_path(slug)
    prefix, block = last_block(read(slug))
    path.write_text(prefix + replace_section(block, heading, body))


def append_line(slug: str, key: str, line: str) -> None:
    heading, repeatable = SECTIONS[key]
    if not repeatable:
        raise SystemExit(f"'{key}' holds one value - use 'set', not 'append'")
    _, block = last_block(read(slug))
    current = section_body(block, heading)
    body = line if current in ("", "TODO") else f"{current}\n{line}"
    write_section(slug, key, body)


def status(slug: str) -> str:
    _, block = last_block(read(slug))
    pending = [
        key
        for key, (heading, _) in SECTIONS.items()
        if section_body(block, heading) == "TODO"
    ]
    return f"pending: {', '.join(pending)}" if pending else "complete"


def iterate(slug: str) -> Path:
    path = record_path(slug)
    text = read(slug)
    count = len(re.findall(r"^# Iteration ", text, re.M))
    path.write_text(text + f"\n# Iteration {count + 1}\n\n{TEMPLATE}")
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("new").add_argument("slug")
    subparsers.add_parser("status").add_argument("slug")
    subparsers.add_parser("show").add_argument("slug")
    subparsers.add_parser("iterate").add_argument("slug")

    get_command = subparsers.add_parser("get")
    get_command.add_argument("slug")
    get_command.add_argument("section", choices=sorted(SECTIONS))

    set_command = subparsers.add_parser("set")
    set_command.add_argument("slug")
    set_command.add_argument("section", choices=sorted(SECTIONS))
    set_command.add_argument("text")

    append_command = subparsers.add_parser("append")
    append_command.add_argument("slug")
    append_command.add_argument("section", choices=sorted(SECTIONS))
    append_command.add_argument("line")

    evidence_command = subparsers.add_parser("evidence")
    evidence_command.add_argument("slug")
    evidence_command.add_argument("kind", choices=EVIDENCE_KINDS)
    evidence_command.add_argument("ref")

    result_command = subparsers.add_parser("result")
    result_command.add_argument("slug")
    result_command.add_argument("value", choices=RESULTS)

    args = parser.parse_args()

    if args.command == "new":
        print(create(args.slug))
        return 0
    if args.command == "get":
        heading, _ = SECTIONS[args.section]
        _, block = last_block(read(args.slug))
        print(section_body(block, heading))
        return 0
    if args.command == "set":
        write_section(args.slug, args.section, args.text)
        return 0
    if args.command == "append":
        append_line(args.slug, args.section, f"- {args.line}")
        return 0
    if args.command == "evidence":
        append_line(args.slug, "evidence", f"- {args.kind}: {args.ref}")
        return 0
    if args.command == "result":
        write_section(args.slug, "result", args.value)
        return 0
    if args.command == "status":
        print(status(args.slug))
        return 0
    if args.command == "show":
        print(read(args.slug))
        return 0

    print(iterate(args.slug))
    return 0


if __name__ == "__main__":
    sys.exit(main())
