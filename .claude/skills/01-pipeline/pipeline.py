#!/usr/bin/env python3
"""Run every pipeline gate for one slug, in order, and stop at the first one
that fails.

        python3 .claude/skills/01-pipeline/pipeline.py <slug>            cheap gates
        python3 .claude/skills/01-pipeline/pipeline.py <slug> --deep     all of them
        python3 .claude/skills/01-pipeline/pipeline.py <slug> --json     for a tool
        python3 .claude/skills/01-pipeline/pipeline.py <slug> --stage 3  just that one

The point of the ordering is that a later gate reading a broken earlier
contract reports a confusing failure in the wrong place. `pnpm check` will
fail on a component that never got a registry entry, and it takes a minute to
say what stage 01 says in a second. So this stops at the first failure and
names the skill that owns it, rather than reporting six failures that are all
the same failure.

Cost is why `--deep` exists. Stages 04 and 06 boot a built server and run a
full build, which is a minute or more. They are skipped by default and the
report says so, because a gate nobody runs because it is slow is worse than a
gate that announces it was not run.

Exit codes: 0 every gate that ran passed, 1 a gate failed, 2 no such slug.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

HERE = Path(__file__).resolve().parent
COMMAND_TIMEOUT = 900


def load_intake():
    """Import intake.py by path, so this works from any working directory."""
    spec = importlib.util.spec_from_file_location("intake", HERE / "intake.py")
    if spec is None or spec.loader is None:
        sys.exit("cannot load intake.py next to this script")
    module = importlib.util.module_from_spec(spec)
    # Register before executing: @dataclass resolves its own module out of
    # sys.modules, and on 3.14 an unregistered module makes that lookup crash.
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


intake = load_intake()


@dataclass
class Result:
    """What one gate decided, and what to do when it says no."""

    number: int
    name: str
    passed: bool
    skipped: bool
    skill: str
    detail: list[str] = field(default_factory=list)
    seconds: float = 0.0


def run(command: list[str], root: Path) -> tuple[int, str]:
    """Run a repo command. A missing binary is a failure, never a pass."""
    try:
        finished = subprocess.run(
            command,
            cwd=root,
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT,
        )
    except FileNotFoundError:
        return 127, f"{command[0]} is not installed"
    except subprocess.TimeoutExpired:
        return 124, f"timed out after {COMMAND_TIMEOUT}s: {' '.join(command)}"
    return finished.returncode, (finished.stdout + finished.stderr)


def stage_01_intake(root: Path, slug: str) -> Result:
    kind = intake.detect_kind(root, slug)
    if kind is None:
        return Result(
            1, "intake", False, False, "add-a-component", [f"no such slug: {slug}"]
        )
    links = intake.links_for(root, slug, kind)
    missing = [
        f"{link.name}: {link.action}"
        for link in links
        if link.required and not link.present
    ]
    return Result(1, "intake", not missing, False, "add-a-component", missing)


def stage_02_document(root: Path, slug: str) -> Result:
    """The docs report always exits 0 on purpose, so read its findings."""
    code, output = run(["pnpm", "run", "docs", "--json"], root)
    if code != 0:
        return Result(
            2, "document", False, False, "document-an-element", [output.strip()[:200]]
        )
    start = output.find("{")
    if start < 0:
        return Result(
            2,
            "document",
            False,
            False,
            "document-an-element",
            ["no JSON in docs output"],
        )
    try:
        # raw_decode, not loads: pnpm prints its own banner around the report,
        # so the JSON object is followed by text that is not part of it.
        report, _ = json.JSONDecoder().raw_decode(output[start:])
    except json.JSONDecodeError as error:
        return Result(
            2,
            "document",
            False,
            False,
            "document-an-element",
            [f"unreadable JSON: {error}"],
        )
    rows = [row for row in report.get("elements", []) if row.get("slug") == slug]
    if not rows:
        return Result(
            2,
            "document",
            True,
            True,
            "document-an-element",
            ["not a documented element"],
        )
    findings = [str(finding) for row in rows for finding in row.get("findings", [])]
    return Result(2, "document", not findings, False, "document-an-element", findings)


def stage_03_conform(root: Path, _slug: str) -> Result:
    code, output = run(["pnpm", "run", "doctor"], root)
    detail = [
        line for line in output.splitlines() if line.strip().startswith(("✗", "→", "!"))
    ]
    return Result(
        3, "conform", code == 0, False, "sushindustries-conventions", detail[:12]
    )


def stage_04_verify(root: Path, _slug: str) -> Result:
    code, output = run(["pnpm", "test"], root)
    detail = [line for line in output.splitlines() if "FAIL" in line or "✗" in line]
    return Result(4, "verify", code == 0, False, "verify-component", detail[:12])


def stage_05_prune(root: Path, slug: str) -> Result:
    """No command owns this one, so it reports rather than gates.

    `simplify` is a judgement about whether a page has become a manual, and a
    number cannot make that call. Reporting the size is the honest half.
    """
    kind = intake.detect_kind(root, slug)
    if kind != "component":
        return Result(
            5, "prune", True, True, "simplify", ["only components carry docs tabs"]
        )
    owner = intake.owner_package(root, slug)
    package = owner[0] if owner else "ui"
    home = root / f"packages/{package}/docs/{slug}/index.md"
    if not home.is_file():
        return Result(5, "prune", True, True, "simplify", ["no docs home to measure"])
    words = len(home.read_text(encoding="utf-8").split())
    over = words > 350
    note = f"docs home is {words} words, the budget is 350"
    return Result(5, "prune", not over, False, "simplify", [note] if over else [])


def stage_06_ship(root: Path, _slug: str) -> Result:
    code, output = run(["pnpm", "check"], root)
    detail = [line for line in output.splitlines() if "error" in line.lower()]
    return Result(
        6, "ship", code == 0, False, "the pipeline in .claude/pipeline.md", detail[:12]
    )


# (number, gate, is_slow, needs_install)
#
# `needs_install` is a hard dependency, not a soft one. Stages 01 and 05 read
# the filesystem and work on a fresh clone with nothing installed at all. The
# rest shell out to pnpm scripts, and without `node_modules` they fail with a
# resolution error that says nothing about the actual problem. Only the hard
# ones carry the explicit "run pnpm install" pointer; putting it on the others
# would be cargo-culting a line that is not load-bearing there.
STAGES = [
    (1, stage_01_intake, False, False),
    (2, stage_02_document, False, True),
    (3, stage_03_conform, False, True),
    (4, stage_04_verify, True, True),
    (5, stage_05_prune, False, False),
    (6, stage_06_ship, True, True),
]


def is_prepared(root: Path) -> bool:
    """Has `pnpm install` run? Every pnpm-script gate depends on it."""
    return (root / "node_modules").is_dir()


def report(slug: str, results: list[Result]) -> None:
    print(f"\n  {slug}\n")
    for result in results:
        if result.skipped:
            mark = "skip"
        elif result.passed:
            mark = "pass"
        else:
            mark = "FAIL"
        took = f"{result.seconds:.1f}s" if result.seconds >= 0.05 else ""
        print(f"  {mark}  {result.number:02d} {result.name:<10} {took}")
        for line in result.detail:
            print(f"          {line}")
    failed = next(
        (result for result in results if not result.passed and not result.skipped), None
    )
    if failed:
        print(f"\n  stopped at stage {failed.number:02d} ({failed.name}).")
        print(f"  the skill that owns it: {failed.skill}\n")
    else:
        print("\n  every gate that ran passed.\n")


def main() -> int:
    parser = argparse.ArgumentParser(add_help=True, description=__doc__)
    parser.add_argument("slug")
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    parser.add_argument("--deep", action="store_true", help="also run the slow gates")
    parser.add_argument("--stage", type=int, help="run only this stage number")
    options = parser.parse_args()

    root = intake.repo_root()
    if intake.detect_kind(root, options.slug) is None:
        print(f"\n  {options.slug}: nothing by that name exists yet.")
        print(f"  start it: pnpm new <post|page|component|package> {options.slug}\n")
        return 2

    prepared = is_prepared(root)
    results: list[Result] = []
    for number, gate, is_slow, needs_install in STAGES:
        if options.stage is not None and number != options.stage:
            continue
        if needs_install and not prepared:
            results.append(
                Result(
                    number,
                    gate.__name__.split("_", 2)[2],
                    False,
                    False,
                    "",
                    ["this gate runs a pnpm script - run `pnpm install` first"],
                )
            )
            break
        if is_slow and not options.deep and options.stage is None:
            results.append(
                Result(
                    number,
                    gate.__name__.split("_", 2)[2],
                    True,
                    True,
                    "",
                    ["slow, use --deep"],
                )
            )
            continue
        started = time.monotonic()
        result = gate(root, options.slug)
        result.seconds = time.monotonic() - started
        results.append(result)
        if not result.passed and not result.skipped:
            break

    if options.json:
        print(
            json.dumps(
                {"slug": options.slug, "stages": [vars(r) for r in results]}, indent=2
            )
        )
    else:
        report(options.slug, results)
    return 1 if any(not r.passed and not r.skipped for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
