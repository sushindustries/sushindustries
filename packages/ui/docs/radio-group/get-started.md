---
title: Get Started
summary: Render Radio Group once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { RadioGroup } from "@sushindustries/ui";

export function ShippingSpeed() {
	return (
		<RadioGroup
			label="Shipping speed"
			options={[
				{ value: "standard", label: "Standard - 3 to 5 days" },
				{ value: "express", label: "Express - next day" },
			]}
			defaultValue="standard"
		/>
	);
}
```

## What you should see

A fieldset with "Shipping speed" as its legend, and one radio per option
below it, painted in the site's accent colour. "Standard" starts checked
because of `defaultValue`; clicking "Express" moves the dot with no code of
your own, since this example passes neither `value` nor `onChange`.

## If nothing happens

An empty `options` array renders the legend and nothing else - that's
correct. If clicking a radio does nothing, check whether `value` is set
without `onChange`: a controlled group with no handler is frozen on purpose,
the same as any controlled input.
