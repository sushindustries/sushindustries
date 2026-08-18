---
name: core
description: >
  How to install and style a component from @sushindustries/ui: the two
  install paths (pnpm add, or the TanStack CLI add-on registry), the rule
  that every style comes from @sushindustries/atoms rather than app CSS, and
  variants expressed as a data attribute rather than a second class. Load
  this when adding, installing, or styling any @sushindustries/ui component.
metadata:
  type: core
  library: '@sushindustries/ui'
  library_version: '0.1.0'
sources:
  - 'sushindustries/sushindustries:packages/ui/README.md'
  - 'sushindustries/sushindustries:.claude/skills/sushindustries-conventions/SKILL.md'
---

## Setup

```bash
pnpm add @sushindustries/ui @sushindustries/atoms
```

```ts
// once, at the app root - components carry no styles of their own
import "@sushindustries/atoms/atoms.css";
```

```tsx
import { Reveal, Section } from "@sushindustries/ui";

export function Page() {
	return (
		<Section kicker="Now" heading="Shipping" body="A short paragraph.">
			<Reveal>
				<p>Fades and rises the first time it reaches the viewport.</p>
			</Reveal>
		</Section>
	);
}
```

## Core Patterns

### Install one component via the registry, not the whole package

Every component is also a standalone registry item. The TanStack CLI add-on
index at `<site-origin>/r/registry.json` lets a project pull in one
component and whatever it depends on, without adding the full package as a
dependency:

```bash
tanstack create my-app --add-ons https://adamjurek.com/r/registry.json
```

### A variant is a prop that writes a data attribute, never a second class

```tsx
<Card density="compact" />
```

The component writes `data-density="compact"`; the matching rule lives in
`@sushindustries/atoms`, already shipped. There is no `.card--compact` class
to reach for - a modifier class needs the consumer to know both class names
and can be applied without its base, which a data attribute cannot.

### Installing a component can drag in another one

A component's registry entry declares its own dependencies. Installing
`archive` also installs `card`, because `archive` is built from it - this is
the same dependency list both npm and the registry installer read, so it
cannot be true for one and not the other.

### State is the same mechanism as a variant

`data-active`, `data-open`, `data-view` - not a second class, not inline
styles. If a class is only ever used once inline, it does not belong in
`@sushindustries/atoms` yet either; a utility earns its place by repeating
at least three times.

## Common Mistakes

### [HIGH] Writing a modifier class instead of a data attribute

Wrong:

```css
.card--compact {
	padding: var(--s-3);
}
```

Correct:

```css
.card[data-density="compact"] {
	padding: var(--s-3);
}
```

A modifier class needs a consumer to know both names and apply them
together; the component only ever writes the attribute, so a stylesheet
built around a second class never actually matches anything the component
renders.

Source: sushindustries/sushindustries:.claude/skills/sushindustries-conventions/SKILL.md

### [HIGH] Writing component-specific CSS in the consuming app

Wrong:

```css
/* apps/my-app/src/styles/showcase-overrides.css */
.showcase-card {
	border-radius: 12px;
}
```

Correct: use the variant the component already exposes, or install the
missing token/utility from `@sushindustries/atoms` instead of restyling
around it from outside.

A component styled from outside its own package looks finished only on the
one page that happens to load that extra stylesheet - install it in a
project with no such file and it renders with the class present but no
rule to answer it.

Source: sushindustries/sushindustries:pipeline.md (documentation surface / styling)

### [MEDIUM] Forgetting to import `atoms.css`

Wrong: importing `@sushindustries/ui` components and rendering them with no
`@sushindustries/atoms/atoms.css` import anywhere in the app.

Correct: import the stylesheet once, at the root, before any component
renders.

The component still renders - markup is correct, nothing throws - it just
carries no styling at all, because every class it emits is defined in that
one stylesheet and nowhere else.

Source: sushindustries/sushindustries:packages/ui/README.md

### [MEDIUM] Reaching for an arbitrary value instead of the token scale

Wrong:

```tsx
<div style={{ color: "#ff6600" }} />
```

Correct: add the color to the token scale in `@sushindustries/atoms` first,
then reference the token - there is no arbitrary-value escape hatch by
design.

A literal color outside the token scale is the exact point where changing
the shared accent token stops changing every consumer of it at once.

Source: sushindustries/sushindustries:pipeline.md (styling)
