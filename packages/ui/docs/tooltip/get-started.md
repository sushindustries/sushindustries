---
title: Get Started
summary: Render Tooltip once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Icon, Tooltip } from "@sushindustries/ui";

export function CopyIconButton() {
	return (
		<Tooltip label="Copy to clipboard">
			<button type="button" aria-label="Copy to clipboard">
				<Icon name="copy" size={16} />
			</button>
		</Tooltip>
	);
}
```

## What you should see

Nothing, at first. The child renders exactly as it would on its own - `Tooltip`
wraps it in an inline-block span and adds nothing visible. Hover the button, or
tab to it, and a small dark bubble appears above it after a short pause,
carrying the label. Move away or blur it and the bubble fades out immediately.

## If nothing happens

There is no touch fallback. `:hover` and `:focus-within` are the only two
triggers the CSS listens for, so a tap on a touchscreen with no keyboard
focus behind it never reveals the bubble. If the label needs to reach a touch
reader, it needs another route to the same information, not this component.
