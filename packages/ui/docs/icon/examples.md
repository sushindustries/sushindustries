---
title: Examples
summary: Icon in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="icon" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Icon } from "@sushindustries/ui";

export function DownloadButton() {
	return (
		<button type="button" className="btn flex items-center gap-2">
			<Icon name="download" size={16} />
			Download
		</button>
	);
}
```

## What this example is not

The button's accessible name comes from the word "Download", not from the
icon - `Icon` is always `aria-hidden`. An icon-only version of this button
would need `aria-label="Download"` on the `<button>` itself.
