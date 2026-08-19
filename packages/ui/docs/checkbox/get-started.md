---
title: Get Started
summary: Render Checkbox once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useState } from "react";
import { Checkbox } from "@sushindustries/ui";

export function Example() {
	const [checked, setChecked] = useState(false);

	return (
		<Checkbox
			label="Email me about releases"
			checked={checked}
			onChange={(event) => setChecked(event.target.checked)}
		/>
	);
}
```

## What you should see

A native checkbox painted in the site's accent colour when checked, with
the label text beside it - clicking the label toggles the box too, since
both are wrapped in one `<label>`. There is no custom check mark drawn by
this component; the tick is the browser's own.

## If nothing happens

A checkbox that will not check itself and never calls `onChange` usually
means it was rendered with `checked` but no `onChange` - React treats
that as a read-only control and blocks input, which is correct behaviour
for a controlled component missing its other half, not a bug in
`Checkbox`.
