---
name: core
description: >
  The @sushindustries/atoms utility vocabulary: one class per job, the
  --s-* spacing token scale with no arbitrary-value escape hatch, container
  queries for component-level responsiveness, and the fluid-unit rules
  (clamp with a rem term, dvh not vh). Load when styling anything with
  @sushindustries/atoms or writing CSS meant to ship inside a component.
metadata:
  type: core
  library: '@sushindustries/atoms'
  library_version: '0.1.0'
sources:
  - 'sushindustries/sushindustries:packages/atoms/README.md'
---

## Setup

```ts
// once, at the app root
import "@sushindustries/atoms/atoms.css";
```

```tsx
<article className="card">
	<h3 className="h3 m-0">Title</h3>
	<p className="m-0 fg-dim text-sm">Body copy.</p>
</article>
```

## Core Patterns

### Compose utilities, one class per job

Each class does exactly one thing (`.flex`, `.gap-3`, `.text-sm`) - reach for
several small classes rather than a component-specific rule, the same way
Bootstrap's utility API works, but with one name per job instead of several
spellings of the same idea.

### The token scale is the only value that exists

Spacing is `--s-1` through `--s-9`. There is no arbitrary-value syntax by
design - a value not on the scale gets added to the scale, or the nearest
scale value is used instead.

### Container queries for a component's own width

```css
.cq {
	container-type: inline-size;
}

@container (min-width: 30rem) {
	.thing {
		grid-template-columns: 1fr 1fr;
	}
}
```

A component three levels inside a sidebar cannot be correct in both the
sidebar and the main column from one answer about the *window* - only a
container query answers the question actually being asked.

### Fluid type needs a `rem` term in the clamp

```css
--t-h2: clamp(1.5rem, 1.1rem + 1.9vw, 2.5rem);
```

Floor, preferred, ceiling - and the preferred term carries a `rem` component
so the value still responds to a reader's font-size setting, not only the
viewport.

## Common Mistakes

### [HIGH] Reaching for an arbitrary value instead of the token scale

Wrong:

```tsx
<div style={{ marginTop: "13px" }} />
```

Correct: use the nearest step on the `--s-*` scale, or add the value to the
scale first if none fits.

There is no arbitrary-value syntax here on purpose - a short scale is what
keeps an interface measured. A one-off pixel value is the first crack in
that, and it never stays a one-off.

Source: sushindustries/sushindustries:packages/atoms/README.md (Why not Tailwind)

### [HIGH] Writing a `vw`-only preferred term in a fluid clamp

Wrong:

```css
--t-h2: clamp(1.5rem, 1.9vw, 2.5rem);
```

Correct:

```css
--t-h2: clamp(1.5rem, 1.1rem + 1.9vw, 2.5rem);
```

A preferred term of pure `vw` is a function of the window and nothing else -
someone who has raised their browser's base font size gets the exact same
heading size as someone who hasn't, silently overriding a preference they
set on purpose.

Source: sushindustries/sushindustries:packages/atoms/README.md (clamp middle term)

### [MEDIUM] Using `100vh` for a full-screen mobile element

Wrong:

```css
height: 100vh;
```

Correct:

```css
height: 100dvh;
```

On a mobile browser, `vh` is measured with the address bar retracted, so a
`100vh` element is taller than the visible screen while the bar shows - its
last hundred pixels sit below the fold and are unreachable until the bar
hides.

Source: sushindustries/sushindustries:packages/atoms/README.md (dvh, not vh)

### [MEDIUM] Using a media query to make one component responsive to itself

Wrong:

```css
@media (min-width: 30rem) {
	.sidebar-widget {
		grid-template-columns: 1fr 1fr;
	}
}
```

Correct: opt the component into `.cq` and use `@container` instead.

A media query answers how wide the *window* is; a component embedded three
levels inside a narrow sidebar needs to answer how wide *it* is, and those
two answers are different on the same page.

Source: sushindustries/sushindustries:packages/atoms/README.md (container queries)
