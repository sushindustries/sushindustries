#!/usr/bin/env python3
"""Watch the GitHub Actions runs for a commit until they stop, cancelling the
ones that are only costing money.

        python3 .claude/skills/01-pipeline/ci.py                 # watch HEAD
        python3 .claude/skills/01-pipeline/ci.py --max-seconds 300    # cancel a run past 5 minutes
        python3 .claude/skills/01-pipeline/ci.py --sha <sha>
        python3 .claude/skills/01-pipeline/ci.py --json

Waiting on CI by hand is the part that goes wrong. A run that never gets a
runner sits queued for free and proves nothing; a run that hangs bills until
GitHub's own six-hour timeout. Both look identical to somebody refreshing a
tab, so this separates them: queued time is free and is waited on, running
time is charged and is capped.

Two things are cancelled without asking:

- anything still running past `--max-seconds` (default 10 minutes), because a job
  that has doubled its usual time has hung rather than slowed
- every Codespaces Prebuild, always. It rebuilds a container on each push to
  the default branch, and this repo has no `.devcontainer` for it to prebuild.
  It cannot be disabled through the API, so the only lever left is to cancel
  it each time it appears.

Exit codes: 0 every run concluded successfully, 1 at least one failed or was
cancelled for cost, 2 `gh` is unusable.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from dataclasses import dataclass

PREBUILD = "Codespaces Prebuilds"

# Back off rather than poll flat. Every pass costs a `gh run list` against the
# REST quota, and a run that has just started is not going to be finished
# fifteen seconds later. The last value repeats for the rest of the wait.
POLL_BACKOFF = (30, 60, 120)


@dataclass
class Run:
    """One workflow run, and why it ended the way it did."""

    id: int
    name: str
    status: str
    conclusion: str
    workflow: str

    @property
    def finished(self) -> bool:
        return self.status == "completed"

    @property
    def billing(self) -> bool:
        """Queued runs cost nothing. Only a started one is on the clock."""
        return self.status == "in_progress"

    @property
    def wasteful(self) -> bool:
        return self.workflow == PREBUILD


def gh(*arguments: str) -> tuple[int, str]:
    try:
        finished = subprocess.run(
            ["gh", *arguments], capture_output=True, text=True, timeout=120
        )
    except FileNotFoundError:
        return 127, "gh is not installed"
    except subprocess.TimeoutExpired:
        return 124, "gh timed out"
    return finished.returncode, finished.stdout + finished.stderr


def head_sha() -> str:
    finished = subprocess.run(
        ["git", "rev-parse", "HEAD"], capture_output=True, text=True
    )
    return finished.stdout.strip()


def runs_for(sha: str) -> list[Run]:
    code, output = gh(
        "run",
        "list",
        "--commit",
        sha,
        "--limit",
        "30",
        "--json",
        "databaseId,name,status,conclusion,workflowName",
    )
    if code != 0:
        raise RuntimeError(output.strip())
    return [
        Run(
            row["databaseId"],
            row["name"],
            row["status"],
            row["conclusion"] or "",
            row.get("workflowName", ""),
        )
        for row in json.loads(output or "[]")
    ]


def cancel(run: Run, why: str) -> None:
    gh("run", "cancel", str(run.id))
    print(f"  cancelled {run.workflow or run.name} ({why})")


def failure_reason(run: Run) -> str:
    """The first error line from a failed run, rather than a link to go read."""
    _, output = gh("run", "view", str(run.id), "--log-failed")
    for line in output.splitlines():
        if "##[error]" in line:
            return line.split("##[error]", 1)[1].strip()
    return "no error line in the log"


def watch(sha: str, max_seconds: int) -> list[Run]:
    """Poll until nothing is left running, cancelling waste as it appears."""
    started: dict[int, float] = {}
    passes = 0
    while True:
        current = runs_for(sha)
        if not current:
            print("  no runs for this commit yet.")
            return []
        for run in current:
            if run.finished:
                continue
            if run.wasteful:
                cancel(run, "prebuild, nothing here uses a devcontainer")
                continue
            if run.billing:
                first_seen = started.setdefault(run.id, time.monotonic())
                if time.monotonic() - first_seen > max_seconds:
                    cancel(run, f"ran longer than {max_seconds}s")
        # One read per poll. A cancellation issued above lands as "completed"
        # on the next pass, which is also when it should be reported.
        if all(run.finished for run in current):
            return current
        time.sleep(POLL_BACKOFF[min(passes, len(POLL_BACKOFF) - 1)])
        passes += 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sha", default="", help="commit to watch (default HEAD)")
    parser.add_argument(
        "--max-seconds",
        type=int,
        default=600,
        help="seconds a run may spend actually running before it is cancelled",
    )
    parser.add_argument("--json", action="store_true")
    options = parser.parse_args()

    code, _ = gh("auth", "status")
    if code == 127:
        print("gh is not installed - see https://cli.github.com", file=sys.stderr)
        return 2

    sha = options.sha or head_sha()
    print(f"\n  watching {sha[:8]}\n")
    try:
        final = watch(sha, options.max_seconds)
    except RuntimeError as error:
        print(f"  could not read runs: {error}", file=sys.stderr)
        return 2

    failed = [run for run in final if run.conclusion not in ("success", "skipped", "")]
    if options.json:
        print(json.dumps([vars(run) for run in final], indent=2))
    else:
        print()
        for run in final:
            print(f"  {run.conclusion or 'none':<10} {run.workflow or run.name}")
        for run in failed:
            if run.conclusion == "failure":
                print(f"\n  {run.workflow}: {failure_reason(run)}")
        print()
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
