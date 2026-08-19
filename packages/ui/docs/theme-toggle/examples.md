---
title: Examples
summary: Theme Toggle in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="theme-toggle" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

The way this site actually uses it - the trailing end of the nav, wired to
a cookie so the theme survives a reload without a flash.

```tsx
import { NavBar, ThemeToggle } from "@sushindustries/ui";
import { setThemeCookie } from "~/modules/theme/theme.functions";

export function SiteNav({ theme }: { theme: string }) {
	return (
		<NavBar
			brand={<span className="mono">acme</span>}
			entries={[]}
			trailing={
				<ThemeToggle
					options={[
						{ id: "light", label: "Light", icon: "sun" },
						{ id: "dark", label: "Dark", icon: "moon" },
						{ id: "system", label: "System", icon: "contrast" },
					]}
					value={theme}
					onChange={(id) => setThemeCookie(id)}
				/>
			}
		/>
	);
}
```

## What this example is not

`theme` here has to arrive already correct from a server-rendered cookie
read - the `<html>` attribute this toggle affects has to be right on the
very first byte, or the switch from server theme to client theme is a
visible flash that no client-side effect can undo after the fact.
