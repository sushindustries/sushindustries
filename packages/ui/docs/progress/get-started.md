---
title: Get Started
summary: Render Progress once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Progress } from "@sushindustries/ui";

export function UploadStatus() {
	return <Progress label="Uploading" value={42} />;
}
```

## What you should see

A labelled bar filled to 42%. Omit `value` and the bar switches to the
indeterminate sweep the browser draws natively - useful for "something is
happening, no percentage yet" rather than faking it with a value that keeps
resetting to zero.

## If nothing happens

`label` is required and has no default - a bar with no label has nothing for
a screen reader to announce alongside the number. If the bar shows but looks
like the browser default rather than the site's style, `atoms.css` isn't
imported.
