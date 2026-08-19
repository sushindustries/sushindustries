---
title: Examples
summary: Model Mark in something real, at icon size, on the real shelf.
---

This site's own desktop is the example. One icon on it - the one with the
`sushi` glyph - is a live `ModelMark` rather than a flat SVG:

<!-- ::start:shelf -->
<!-- ::end:shelf -->

## In a page

This site's mark wraps `ModelMark` in exactly one file, and it decides only
two things: which model, and which glyph goes underneath it. Everything
about *how* a model behaves at icon size - the camera fit, the disabled
controls, the reduced-motion path - stays inside the element:

```tsx
import { ModelMark } from "@sushindustries/react-product-viewer/model-mark";
import { Icon } from "@sushindustries/ui";
import { LOGO_MODEL } from "./logo";

export function SiteMark({ seconds = 18 }: { seconds?: number }) {
	return (
		<ModelMark
			model={LOGO_MODEL}
			seconds={seconds}
			motion="sway"
			label="Sushi Industries"
			glyph={<Icon name="sushi" size={30} />}
			className="site-mark"
		/>
	);
}
```

`motion="sway"` is a fact about this logo, not a stylistic pick: the mark
has a front, and the default `spin` would show it edge-on for half of every
revolution.

## What this example is not

The shelf above renders exactly one live mark among a grid of flat icons -
`ModelMark` is not meant to replace every glyph on a page. Every other icon
on that shelf is a plain SVG, on purpose: a live model is a hero treatment
for the one entry that deserves it, not a default.
