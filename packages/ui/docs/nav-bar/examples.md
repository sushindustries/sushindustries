---
title: Examples
summary: Nav Bar in something real, at every width it has to survive.
---

<!-- ::start:showcase demo="nav-bar" height="420" -->
<!-- ::end:showcase -->

Press Compare, then open a panel at each width. The mobile view collapses
every entry into one burger; the desktop and tablet views keep the row and
narrow only the panel that opens under it.

## In a page

```tsx
import { NavBar } from "@sushindustries/ui";
import { Link, useRouter } from "@tanstack/react-router";

export function SiteHeader() {
	const router = useRouter();

	return (
		<NavBar
			brand={<span>My Site</span>}
			entries={[{ id: "work", label: "Work", href: "/work" }]}
			renderLink={({ href, className, children }) => (
				<Link to={href} className={className}>
					{children}
				</Link>
			)}
		/>
	);
}
```

## What this example is not

`renderLink` here is written for TanStack Router specifically. The prop
itself is router-agnostic - swap the body for whatever `Link` component the
host actually uses, or leave it out entirely for plain anchors.
