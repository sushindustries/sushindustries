# 05 - voice

> One person builds this. Write "I", not "we".

## Rules

| Rule | Layer | Enforced by |
| --- | --- | --- |
| First person singular in site copy, READMEs and comments | House | `nobody` |
| No em dashes | House | `doctor` (`checkNoEmDashes`, repairable) |
| Headings descend in order; one `h1` per page | House | `tests` (`semantics.test.ts`) |
| Comments explain why, per group, in English | House | `nobody` |

## The voice

No "our team", no royal plural, no "we" standing in for one person. This is a
portfolio and a library built by one person, and the copy says so.

Short sentences. Plain words. `h1` then `h2` then `h3`, in order, because the
outline is the page's structure and not its decoration.

A heading earns its place by giving the reader something to take away. If a
heading could be deleted and the section would read the same, delete it.

## Comments

Comments explain **what the code avoids**, not what it does. The next reader
can see what the line does; what they cannot see is the failure it was written
around.

Per meaningful group, never line by line. In English, always - the code is
public.

A comment that says where a pattern came from, or that argues the change is
correct, is talking to a reviewer rather than to the next reader, and it
becomes noise the moment the change merges.

## Em dashes

There are none, and `pnpm run doctor --fix` removes any that arrive. A spaced
em dash becomes " - ", an unspaced one becomes "-".

This is checked on every tracked `.md`, `.ts`, `.tsx`, `.css`, `.mjs`,
`.json`, `.yml` and `.yaml`, which includes these skill files.

## Before you finish

- [ ] Nothing says "we" about work one person did.
- [ ] Headings descend in order and each one earns its place.
- [ ] Comments say why, not what.
- [ ] `pnpm run doctor` passes.
