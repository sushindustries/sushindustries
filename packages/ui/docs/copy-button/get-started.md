---
title: Get Started
summary: Render Copy Button once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { CopyButton } from "@sushindustries/ui";

export function Example() {
	return (
		<code className="code">
			pnpm add @sushindustries/ui
			<CopyButton text="pnpm add @sushindustries/ui" ground="paper" />
		</code>
	);
}
```

## What you should see

A glass chip reading "Copy" with a copy glyph. Click it and the glyph swaps to
a tick, the label reads "Copied", and after two seconds it hands back to the
resting state on its own - no toast, no second element appearing anywhere
else on the page.

## If nothing happens

If clicking never shows "Copied", the page is not in a secure context (plain
HTTP rather than HTTPS or localhost) - `navigator.clipboard` does not exist
there, and the button treats that the same as a denied permission: it fails
silently rather than throwing, so check the browser console is quiet, not
loud, before assuming this is broken.
