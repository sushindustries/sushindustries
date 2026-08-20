---
title: Frontmatter API
summary: What it takes, what it gives back, and what it does between.
---

<!-- generated:api -->

## Signature

```ts
splitFrontmatter(raw: string): { frontmatter: string; body: string; }
```

The `---` block and everything after it, told apart. `parseFrontmatter` reads a block; this is what finds one. They are separate because a Markdown parser that reports frontmatter usually hands back the original source with it - so a caller that only parses renders the metadata as a paragraph of text at the top of the page. This existed five times in this repository, once per catalogue, and the copies had drifted: four matched `\r?\n` and the fifth did not, so a page saved with Windows line endings would have had no title, no summary, and its own frontmatter printed as prose. Nothing failed, nothing warned, and the only symptom was one page looking wrong. That is the whole argument for it living here. A regular expression copied five times is five chances to be right, and the one that is wrong is the one nobody reads.

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
