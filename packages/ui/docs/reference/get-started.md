---
title: Get Started
summary: Render Reference once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Ref } from "@sushindustries/ui";

const showcase = {
	title: "Showcase",
	href: "/components/showcase",
	summary: "The live component at three widths, with source.",
	meta: "@sushindustries/ui",
};

export function Paragraph() {
	return (
		<p>
			Wrap any component in <Ref reference={showcase}>Showcase</Ref> to render
			it live.
		</p>
	);
}
```

## What you should see

`Showcase` inline as a link, styled like code. Hovering or focusing it raises
a card above the word with the reference's title, summary and meta line - the
card disappears the moment focus or the pointer leaves. Clicking the word
itself follows `reference.href`, same as any link.

## If nothing happens

The hover card needs no JavaScript to show, so if hovering does nothing the
usual cause is the reference itself: `Ref` renders exactly whatever
`reference` object it's handed, nothing is looked up or fetched, so a stale
or missing `title`/`summary` shows up as blank space in the card rather than
as an error.
