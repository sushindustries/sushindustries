---
title: Get Started
summary: Render Bar Chart once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { BarChart } from "@sushindustries/ui";
import "@sushindustries/atoms/atoms.css";

export function Example() {
	return (
		<BarChart
			label="Tokens per document kind"
			description="Source files are two thirds of the index by weight."
			rows={[
				{ label: "source", value: 412_310 },
				{ label: "component", value: 188_004 },
				{ label: "note", value: 74_920 },
			]}
		/>
	);
}
```

## What you should see

Three horizontal bars in the accent colour, longest at the top, with the
category names read straight across on the left and a rounded tick scale
underneath. `label` and `description` are announced and never drawn. Switch the
site's theme and the bars change with it, because the fill is a custom property
rather than a colour passed in.

## If nothing happens

Bars in the browser's default black with unstyled axis text mean
`@sushindustries/atoms/atoms.css` was never imported - `--chart-fill`,
`--chart-line` and `--chart-text` are declared on `.chart` in that stylesheet,
and an undefined custom property leaves the library drawing with its own
default. An empty `rows` is not an error: it draws `Nothing to draw yet.`
instead.
