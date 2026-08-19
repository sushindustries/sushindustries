#!/usr/bin/env python3
"""Tests for the pipeline gates.

        python3 .claude/skills/01-pipeline/test_pipeline.py

Standard library only, and no network, so this runs anywhere the repo does.
The cheap gates are exercised against the real repo rather than a fixture: a
fixture would pass while the thing it stands for had drifted, which is the
failure mode this whole pipeline exists to catch.

The slow gates (04 verify, 06 ship) are not run here. They boot a built server
and a full build, and `pnpm check` already owns them.
"""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load(name: str):
    spec = importlib.util.spec_from_file_location(name, HERE / f"{name}.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


intake = load("intake")
pipeline = load("pipeline")
ROOT = intake.repo_root()


class RepoRoot(unittest.TestCase):
    def test_finds_the_workspace_root(self) -> None:
        self.assertTrue((ROOT / "pnpm-workspace.yaml").is_file())
        self.assertTrue((ROOT / "packages").is_dir())


class Frontmatter(unittest.TestCase):
    def test_reads_a_field(self) -> None:
        self.assertEqual(intake.frontmatter("---\ntitle: A\n---\n", "title"), "A")

    def test_missing_field_is_empty(self) -> None:
        self.assertEqual(intake.frontmatter("---\ntitle: A\n---\n", "summary"), "")

    def test_empty_field_is_empty(self) -> None:
        self.assertEqual(intake.frontmatter("---\nsummary:\n---\n", "summary"), "")

    def test_does_not_match_a_field_that_merely_ends_the_same(self) -> None:
        """`draft:` must not be answered by `is-draft:`."""
        self.assertEqual(intake.frontmatter("---\nis-draft: true\n---\n", "draft"), "")


class DetectKind(unittest.TestCase):
    def test_a_component(self) -> None:
        self.assertEqual(intake.detect_kind(ROOT, "button"), "component")

    def test_a_hook_is_a_component(self) -> None:
        self.assertEqual(intake.detect_kind(ROOT, "use-scroll-turn"), "component")

    def test_a_package(self) -> None:
        self.assertEqual(intake.detect_kind(ROOT, "atoms"), "package")

    def test_nothing(self) -> None:
        self.assertIsNone(intake.detect_kind(ROOT, "definitely-not-a-real-slug"))


class OwnerPackage(unittest.TestCase):
    def test_finds_the_package_and_extension(self) -> None:
        self.assertEqual(intake.owner_package(ROOT, "button"), ("ui", ".tsx"))

    def test_a_hook_keeps_its_ts_extension(self) -> None:
        self.assertEqual(intake.owner_package(ROOT, "use-scroll-turn"), ("ui", ".ts"))


class IntakeContract(unittest.TestCase):
    def test_every_registry_item_passes_intake(self) -> None:
        """The doctor is green, so no registered item may be blocked here.

        If this fails, either a registry item really is half-wired, or this
        gate has become stricter than the repo it checks. Both are findings.
        """
        registry = (ROOT / "packages/ui/registry.ts").read_text(encoding="utf-8")
        slugs = [
            line.split('"')[1]
            for line in registry.splitlines()
            if line.strip().startswith('name: "')
        ]
        self.assertGreater(len(slugs), 50, "registry parsing found almost nothing")
        blocked = []
        for slug in slugs:
            links = intake.links_for(ROOT, slug, "component")
            missing = [l.name for l in links if l.required and not l.present]
            if missing:
                blocked.append((slug, missing))
        self.assertEqual(blocked, [])

    def test_a_post_with_no_summary_is_blocked(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "apps/web/content/posts").mkdir(parents=True)
            (root / "apps/web/content/posts/x.md").write_text("---\ntitle: X\n---\n")
            links = intake.links_for(root, "x", "post")
            missing = [l.name for l in links if l.required and not l.present]
            self.assertIn("summary", missing)
            self.assertNotIn("title", missing)

    def test_absent_draft_counts_as_published(self) -> None:
        """Only `draft: true` hides a post - the catalogue reads it that way."""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "apps/web/content/posts").mkdir(parents=True)
            (root / "apps/web/content/posts/x.md").write_text(
                "---\ntitle: X\nsummary: S\n---\n"
            )
            published = {l.name: l.present for l in intake.links_for(root, "x", "post")}
            self.assertTrue(published["published"])

    def test_optional_links_never_block(self) -> None:
        links = intake.links_for(ROOT, "button", "component")
        optional = {l.name for l in links if not l.required}
        self.assertIn("demo", optional)
        self.assertIn("docs summary", optional)


class Gates(unittest.TestCase):
    def test_intake_gate_passes_a_real_component(self) -> None:
        result = pipeline.stage_01_intake(ROOT, "button")
        self.assertTrue(result.passed, result.detail)

    def test_intake_gate_fails_an_unknown_slug(self) -> None:
        result = pipeline.stage_01_intake(ROOT, "definitely-not-a-real-slug")
        self.assertFalse(result.passed)

    def test_prune_gate_skips_a_package(self) -> None:
        result = pipeline.stage_05_prune(ROOT, "atoms")
        self.assertTrue(result.skipped)

    def test_a_missing_binary_is_a_failure_not_a_pass(self) -> None:
        code, output = pipeline.run(["definitely-not-a-binary"], ROOT)
        self.assertNotEqual(code, 0)
        self.assertIn("not installed", output)


class StageTable(unittest.TestCase):
    def test_stages_are_numbered_in_order_without_gaps(self) -> None:
        numbers = [number for number, _, _ in pipeline.STAGES]
        self.assertEqual(numbers, list(range(1, len(numbers) + 1)))

    def test_the_slow_gates_are_the_ones_that_build(self) -> None:
        slow = {number for number, _, is_slow in pipeline.STAGES if is_slow}
        self.assertEqual(slow, {4, 6})


if __name__ == "__main__":
    unittest.main(verbosity=2)
