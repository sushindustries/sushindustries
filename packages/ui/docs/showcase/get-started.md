---
title: Get Started
summary: Render Showcase once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Showcase } from "@sushindustries/ui";

export function Example() {
	return (
		<Showcase
			src="/preview/card"
			title="Card"
			code={`<Card>...</Card>`}
			install={{ tanstack: "pnpm dlx @tanstack/cli add card" }}
		/>
	);
}
```

`src` has to point at a real route that renders the component alone, with
nothing else on the page - that route is the app's to build, not something
this component generates.

## What you should see

A bar with Preview and Code tabs, a row of width buttons, and Compare
selected by default: four to six framed iframes side by side, each labelled
with its width and why that width was picked. Switch to Code and the same
component renders again next to its source, with a copy button over the
block. If `install` was passed, a row of copyable commands sits under
whichever tab is open.

## If nothing happens

The frames stay blank when `src` does not resolve to a real page - a typo in
the route, or a preview page that was never built for this component. Check
the Preview tab first with the browser's own devtools open on the iframe; a
404 inside the frame looks identical to an empty component from the outside.
