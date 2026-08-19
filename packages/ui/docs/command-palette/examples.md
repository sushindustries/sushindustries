---
title: Examples
summary: Command Palette in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="command-palette" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CommandPalette } from "@sushindustries/ui";
import { searchEntries } from "./search.catalogue";

export function SiteChrome({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setOpen(true);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<>
			{children}
			<CommandPalette
				entries={searchEntries}
				open={open}
				onClose={() => setOpen(false)}
				onSelect={(entry) => {
					setOpen(false);
					navigate({ to: entry.href });
				}}
			/>
		</>
	);
}
```

## What this example is not

The `⌘K` listener here is the host's own effect, not something
`CommandPalette` sets up for you - the component only reacts to `open`.
`navigate` from the router replaces the plain `window.location` write
from Get Started, which is the difference between a full page load and a
client-side transition.
