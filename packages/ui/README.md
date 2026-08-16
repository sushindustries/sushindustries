# @sushindustries/ui

The components this site is made of. Every element you can see on
sushindustries.com is in here, and nothing in here is site-specific — the site
is just the first thing that imports it.

## Install

```bash
pnpm add @sushindustries/ui @sushindustries/atoms
```

The components carry no styles of their own. They emit class names from
`@sushindustries/atoms`, so import that stylesheet once at the root:

```ts
import "@sushindustries/atoms/atoms.css";
```

## Components

| Component | What it does |
| --- | --- |
| `SmoothScroll` | Mounts Lenis for the page. Renders nothing. |
| `Reveal` | Fades and rises its children the first time they reach the viewport. |
| `ScrollSpin` | Rotates its children with the page scroll. |
| `Section` | Kicker, heading and body, revealing top-down. |
| `Card` | Title, optional meta, whatever you put inside. |
| `MarkdownView` | Renders Markdown with syntax-highlighted code fences. |

## Use

```tsx
import { Reveal, ScrollSpin, Section, SmoothScroll } from "@sushindustries/ui";

export function Page() {
	return (
		<>
			<SmoothScroll />

			<ScrollSpin revolutions={2} tilt={8}>
				<img src="/mark.svg" alt="" />
			</ScrollSpin>

			<Section id="work" label="Work" title="What I build">
				<Reveal delay={80}>
					<p>Anything you like.</p>
				</Reveal>
			</Section>
		</>
	);
}
```

## Everything degrades

Every component here checks `prefers-reduced-motion` and stops moving if it is
set. `Reveal` shows its children immediately rather than leaving them invisible
— a reveal that never fires is a blank page, which is the worst possible
failure for an accessibility preference.

`ScrollSpin` and `SmoothScroll` need a browser, so they do their work in an
effect. The first server render and the first client render are identical,
which is what keeps them safe under SSR.

## Optional peers

`MarkdownView` needs `@tanstack/markdown` and `@tanstack/highlight`;
`SmoothScroll` needs `lenis`. All three are optional peer dependencies — if you
only want `Card` and `Section`, you do not install any of them.
