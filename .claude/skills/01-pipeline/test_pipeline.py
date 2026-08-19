#!/usr/bin/env python3
"""Tests for the pipeline gates.

        python3 .claude/skills/01-pipeline/test_pipeline.py

Standard library only, and no network, so this runs anywhere the repo does.
The cheap gates are exercised against the real repo rather than a fixture: a
fixture would pass while the thing it stands for had drifted, which is the
failure mode this whole pipeline exists to catch.

Most of this goes through `trace()`, the one public entry point, rather than
the private helpers underneath it. Tests that reach past an interface are
tests that make the interface hard to change.

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


def write_post(root: Path, slug: str, body: str) -> None:
    (root / "apps/web/content/posts").mkdir(parents=True, exist_ok=True)
    (root / f"apps/web/content/posts/{slug}.md").write_text(body, encoding="utf-8")


class RepoRoot(unittest.TestCase):
    def test_finds_the_workspace_root(self) -> None:
        self.assertTrue((ROOT / "pnpm-workspace.yaml").is_file())
        self.assertTrue((ROOT / "packages").is_dir())


class FrontmatterParsing(unittest.TestCase):
    """The parser is private, so drive it through a real traced post."""

    def with_body(self, body: str) -> dict[str, bool]:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_post(root, "x", body)
            return {link.name: link.present for link in intake.trace(root, "x").links}

    def test_a_filled_summary_is_present(self) -> None:
        self.assertTrue(self.with_body("---\ntitle: A\nsummary: S\n---\n")["summary"])

    def test_a_missing_summary_is_absent(self) -> None:
        self.assertFalse(self.with_body("---\ntitle: A\n---\n")["summary"])

    def test_an_empty_summary_is_absent(self) -> None:
        """The regression this suite was written for.

        `\\s*` spans newlines, so an empty `summary:` captured the `---` that
        closes the block and read as present. An empty field passing a
        presence check is the false pass the gate exists to prevent.
        """
        self.assertFalse(self.with_body("---\ntitle: A\nsummary:\n---\n")["summary"])

    def test_a_key_that_merely_ends_the_same_does_not_answer(self) -> None:
        links = self.with_body("---\ntitle: A\nsummary: S\nis-draft: true\n---\n")
        self.assertTrue(links["published"])


class Tracing(unittest.TestCase):
    def test_a_component(self) -> None:
        self.assertEqual(intake.trace(ROOT, "button").kind, "component")

    def test_a_hook_is_a_component(self) -> None:
        self.assertEqual(intake.trace(ROOT, "use-scroll-turn").kind, "component")

    def test_a_package(self) -> None:
        self.assertEqual(intake.trace(ROOT, "atoms").kind, "package")

    def test_nothing(self) -> None:
        traced = intake.trace(ROOT, "definitely-not-a-real-slug")
        self.assertFalse(traced.exists)
        self.assertFalse(traced.passed)
        self.assertEqual(traced.links, [])

    def test_docs_home_resolves_for_a_component(self) -> None:
        home = intake.trace(ROOT, "button").docs_home(ROOT)
        self.assertIsNotNone(home)
        assert home is not None
        self.assertTrue(home.is_file())

    def test_docs_home_is_none_for_a_package(self) -> None:
        self.assertIsNone(intake.trace(ROOT, "atoms").docs_home(ROOT))


class Contract(unittest.TestCase):
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
        blocked = [
            (slug, [link.name for link in intake.trace(ROOT, slug).missing])
            for slug in slugs
            if intake.trace(ROOT, slug).missing
        ]
        self.assertEqual(blocked, [])

    def test_a_post_with_no_summary_is_blocked(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_post(root, "x", "---\ntitle: X\n---\n")
            traced = intake.trace(root, "x")
            self.assertFalse(traced.passed)
            self.assertEqual([link.name for link in traced.missing], ["summary"])

    def test_absent_draft_counts_as_published(self) -> None:
        """Only `draft: true` hides a post - the catalogue reads it that way."""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_post(root, "x", "---\ntitle: X\nsummary: S\n---\n")
            traced = intake.trace(root, "x")
            self.assertTrue(traced.passed)

    def test_optional_links_never_block(self) -> None:
        traced = intake.trace(ROOT, "button")
        optional = {link.name for link in traced.links if not link.required}
        self.assertIn("demo", optional)
        self.assertIn("docs summary", optional)
        self.assertNotIn("demo", {link.name for link in traced.missing})


class Gates(unittest.TestCase):
    def test_intake_gate_passes_a_real_component(self) -> None:
        result = pipeline.stage_01_intake(ROOT, "button")
        self.assertTrue(result.passed, result.detail)

    def test_intake_gate_fails_an_unknown_slug(self) -> None:
        result = pipeline.stage_01_intake(ROOT, "definitely-not-a-real-slug")
        self.assertFalse(result.passed)

    def test_prune_gate_skips_a_package(self) -> None:
        self.assertTrue(pipeline.stage_05_prune(ROOT, "atoms").skipped)

    def test_a_missing_binary_is_a_failure_not_a_pass(self) -> None:
        code, output = pipeline.run(["definitely-not-a-binary"], ROOT)
        self.assertNotEqual(code, 0)
        self.assertIn("not installed", output)


class StageTable(unittest.TestCase):
    def test_stages_are_numbered_in_order_without_gaps(self) -> None:
        numbers = [number for number, _, _, _ in pipeline.STAGES]
        self.assertEqual(numbers, list(range(1, len(numbers) + 1)))

    def test_the_slow_gates_are_the_ones_that_build(self) -> None:
        slow = {number for number, _, is_slow, _ in pipeline.STAGES if is_slow}
        self.assertEqual(slow, {4, 6})

    def test_only_the_pnpm_gates_hard_depend_on_an_install(self) -> None:
        """01 and 05 read the filesystem, so a fresh clone can still run them.

        The split is the point: a setup pointer on a gate that does not need
        one is a line that gets cargo-culted and then believed.
        """
        hard = {number for number, _, _, needs in pipeline.STAGES if needs}
        self.assertEqual(hard, {2, 3, 4, 6})

    def test_a_prepared_repo_is_one_with_node_modules(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            self.assertFalse(pipeline.is_prepared(Path(directory)))
            (Path(directory) / "node_modules").mkdir()
            self.assertTrue(pipeline.is_prepared(Path(directory)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
