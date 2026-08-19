---
title: Get Started
summary: Render Native Select once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { NativeSelect } from "@sushindustries/ui";

export function CountryField() {
	return (
		<NativeSelect name="country" defaultValue="pl">
			<option value="pl">Poland</option>
			<option value="de">Germany</option>
			<option value="fr">France</option>
		</NativeSelect>
	);
}
```

## What you should see

A field-styled control with a chevron on the right, holding whichever
`<option>` is selected. Opening it hands off entirely to the platform: the OS
picker on desktop, the wheel on iOS, the sheet Android draws for `<select>`.
None of that chrome is this component's to style - only the closed state is.

## If nothing happens

`NativeSelect` accepts every prop a `<select>` does, so a missing value
usually means missing `<option>` children - an empty select has nothing to
open. If the control renders but looks like the browser default rather than
the site's style, `@sushindustries/atoms/atoms.css` isn't imported at the
root.
