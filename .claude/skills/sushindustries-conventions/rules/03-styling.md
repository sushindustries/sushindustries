# 03 - styling

> Atomic classes from `packages/atoms`. One class, one job. Compose in markup;
> never write a component-specific stylesheet.

## Rules

| Rule | Layer | Enforced by |
| --- | --- | --- |
| Every class a `packages/ui` component uses is defined in `packages/atoms` | House | `doctor` (`checkComponentClassesLiveInAtoms`) |
| A variant is a prop that writes a data attribute, never a modifier class | House | `doctor` (`checkVariantsAreAttributes`) |
| A colour outside `:root` is a token | House | `doctor` (`checkAtomsUseTokens`) |
| Every token a rule references resolves | House | `doctor` (`checkTokensResolve`) |
| Depths and stacking come from the `--z-*` scale | House | `doctor` (`checkDepthsUseTokens`) |
| A new chapter is a new file plus a line in the entry | House | `doctor` (`checkAtomsAreLayered`) |
| Nothing unlayered may style a component | House | `nobody` |
| A block earns its place by repeating | House | `doctor` (`checkBlocksAreEarned`) |
| Both themes work | House | `nobody` |

## Where a style goes

`atoms.css` is an **entry, not a stylesheet**. It holds the layer statement
and then nothing but imports:

```css
@layer tokens, base, blocks, utilities;   /* the cascade, decided here */

@import "./devices.css" layer(blocks);
@import "./tokens.css";
@import "./base.css";
@import "./utilities.css";
@import "./blocks/nav.css";               /* one file per chapter */
```

Each chapter file opens with its own `@layer` wrapper. Cross-layer precedence
comes from the statement at the top, so **file order cannot change which layer
wins**. That is what makes splitting safe, and it is why a chapter must never
be pasted back into the entry.

Three rules follow:

- **A new chapter is a new file plus a line in the entry.** Nothing globs the
  directory, on purpose: the import list *is* the cascade order, so it has to
  be written where a human can read it top to bottom.
- **Order inside a layer still matters.** Rules in the same layer resolve by
  source order on a specificity tie, and `pnpm run doctor` resolves a
  declaration to the first rule providing it. So `utilities.css` is imported
  before `blocks/`, and a chapter goes where its rules already sat.
- **Never reopen a chapter later in the list.** Two `@import`s of the same
  file split its rules around whatever is between them.

Vite flattens every `@import` at build time, so the browser still gets one
file. This was measured, not assumed: splitting 7,990 lines into 44 chapters
emitted a byte-identical asset with the same content hash.

If a value is not in the scale, add it to the scale or use the scale. There is
no arbitrary-value syntax and that is deliberate - a short scale is what makes
an interface look measured rather than assembled.

The one exception is `.prose`, where elements are styled by tag. Markdown tags
come from the author, so there is no markup to attach classes to.

## Variants and extension

A variant is a **prop that writes a data attribute**. Never a second class.

```tsx
<Card density="compact" />          // component writes data-density="compact"
```

```css
.card[data-density="compact"] {
	padding: var(--s-3);
}
```

Not `.card--compact`. A modifier class needs a consumer to know both names and
can be applied without its base; an attribute cannot be applied halfway,
travels with the component when it is installed, and shows up in the props
rather than in a stylesheet somebody has to go and find.

State uses the same mechanism: `data-active`, `data-open`, `data-view`. The
one legacy exception in the codebase is `.archive-chip.is-active`.

Two more rules that follow from it:

- **Extend a block, do not fork it.** A new look is a new attribute value on
  the existing selector, in the same chapter. A second block that is 90% the
  first one is two things to keep in step.
- **A utility earns its place by repeating.** Used once, inline it into the
  named block. Used three times, it is an atom. `px-3` sat in the markup for
  weeks without existing in the stylesheet, doing nothing, because nothing
  checked.

## Hard-won

### Unlayered CSS beats layered CSS

**Rule:** every rule that styles a component lives in `packages/atoms`, inside
a layer. Nothing in `apps/web/src/styles/` may style a component.

**Why:** the day the highlighter's `th-*` classes lived in
`apps/web/src/styles/prose.css`, they silently outranked every `@layer` rule,
because unlayered CSS wins against layered CSS regardless of specificity. The
component looked finished only on the one page that had the stylesheet, and a
consumer installing it got it naked.

**Check:** `pnpm run doctor` reports any class a `packages/ui` component uses
that atoms does not define.

**Last checked:** enforced continuously by the doctor.

### A utility outranks a block's media query

**Rule:** a class that a breakpoint needs to take away must own its own
layout.

**Why:** same lesson, other direction. A `.flex` utility in markup outranks a
block rule's `display: none` inside a media query, which is how the desktop
nav kept rendering on phones.

**Last checked:** fixed; `layout.test.ts` measures both widths with JavaScript
off.

## Before you finish

- [ ] Every class used is defined in atoms.
- [ ] The variant is an attribute, not a `--modifier`.
- [ ] Colours are tokens; values come from the scale.
- [ ] Both themes were looked at, not just the one that was open.
- [ ] `pnpm run doctor` passes.
