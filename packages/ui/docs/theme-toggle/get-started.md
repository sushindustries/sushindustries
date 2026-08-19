---
title: Get Started
summary: Render Theme Toggle once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useState } from "react";
import { ThemeToggle } from "@sushindustries/ui";

export function Example() {
	const [theme, setTheme] = useState("system");

	return (
		<ThemeToggle
			options={[
				{ id: "light", label: "Light", icon: "sun" },
				{ id: "dark", label: "Dark", icon: "moon" },
				{ id: "system", label: "System", icon: "contrast" },
			]}
			value={theme}
			onChange={setTheme}
		/>
	);
}
```

## What you should see

A small pill with three icon buttons in a recessed track, one of them lit.
Click one and the lit segment moves to match `value` - here, just React
state, so the icons switch but nothing on the page changes yet. Arrow keys
move between them once one is focused, and the selection wraps from the
last option back to the first.

## If nothing happens

If the lit icon changes but the page's actual theme does not, that is
expected from this snippet alone - `ThemeToggle` reports which option was
pressed through `onChange` and stops there. Applying the theme (setting
`data-theme` on `<html>`, persisting it in a cookie) is the host's own
wiring, not something this component does for you.
