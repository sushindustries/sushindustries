---
title: Frontmatter API
summary: What it takes, what it gives back, and what it does between.
---

<!-- generated:api -->

## Signature

```ts
parseFrontmatter(raw: string | undefined): Frontmatter
```

```ts
readString(frontmatter: Frontmatter, key: string, fallback = ""): string
```

Frontmatter values are `string | string[]`; most call sites want one string.

```ts
readList(frontmatter: Frontmatter, key: string): readonly string[]
```

<!-- /generated:api -->

## Notes

`parseFrontmatter(undefined)` returns `{}` rather than throwing, so a call
site does not need to guard against a missing frontmatter block before
reading from it.

`readString` and `readList` disagree on purpose about a value of the other
shape: `readString` on a list value returns `fallback`, and `readList` on a
string value wraps it in a one-element array rather than returning `[]`. That
asymmetry exists because a single tag written without brackets (`tags: solo`)
is common enough to be worth treating as a list of one, while a title that
came through as a list has no sensible string to fall back to.
