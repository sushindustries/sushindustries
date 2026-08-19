# Skill spec - sushindustries monorepo

What a SKILL.md in this repo must be, so that every package's skill reads the
same way and stays honest about where its knowledge came from.

## Shape

Each public package that ships an API worth teaching gets exactly one skill,
`skills/core/SKILL.md`, in that package. No trees of fragments: the packages
are small, and one well-scoped core skill per package is easier to keep
current than many partial ones.

## Frontmatter

- `name: core` - matches the parent directory, per the Agent Skills spec.
- `description` - states what the skill teaches *and* when to load it, in
  under 1024 characters. The "load when" sentence is not optional.
- `metadata.type: core`, `metadata.library`, `metadata.library_version` -
  Intent scalars live under `metadata`, never at the top level.
- `sources` - repo-qualified paths
  (`sushindustries/sushindustries:packages/<p>/README.md`) for every document
  the skill was derived from. When a source changes, `intent stale` flags the
  skill.

## Body

Sections, in order:

1. **Setup** - the smallest complete working example, install line included.
2. **Core Patterns** - the rules a consumer must not violate, each with the
   *why* stated (the reason is what stops an agent "fixing" the rule away).
3. **Common Mistakes** - failure modes that look like bugs but are misuse,
   phrased as what goes wrong and what to do instead.

Hard limits: 500 lines per file (Intent validates this), and the body teaches
constraints the types cannot express - API listings belong in the README, not
here.

## Out of scope

- `@sushindustries/llms` - text-file generators, no agent-facing surface yet.
  Recorded in `coverage.ignored_packages` in the YAML artifacts.
- Private packages (`@sushindustries/adam-jurek`, the app) - skipped by
  Intent automatically.
