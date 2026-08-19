---
title: Guides
summary: Using Code Block well, and the mistakes that look like it is broken.
---

## Showing a filename

```tsx
<CodeBlock code={source} language="ts" file="package.json" />
```

The filename renders in a strip above the slab, with a small file glyph.
Passing `file` also switches the block into its wrapped form (`code-shell`),
the same one the copy button and language chip use, so a fence with a name on
it and a fence with a copy button look consistent even when only one of the
two is present.

## Turning the copy button off

```tsx
<CodeBlock code={source} language="json" copy={false} />
```

Reach for `copy={false}` when a fence is a short fragment being read rather
than pasted - a one-line diff inline in a sentence, say. With both `copy` and
`file` unset, `CodeBlock` renders the bare highlighted slab and skips the
wrapper entirely.

## Registering a language

`language` only resolves to something styled if it is listed by hand in
`highlighter.ts`, which is the grammars this site's own content actually
uses, plus a handful of aliases so a fence can be labelled the way people
actually write it:

```ts
languages: [ts, tsx, shell, json, css, plaintext];
```

A language outside that list is not a bug to fix in this component - it is a
one-line addition to the registered set, made on purpose rather than by
pulling in every grammar a highlighter ships.

## When not to use it

A block of code that is never shown, only copied - an install command with no
educational value in reading it - is closer to `CopyButton` wrapped around
plain text than to this.
