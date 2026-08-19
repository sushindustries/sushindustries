---
title: Get Started
summary: Render Breadcrumb once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Breadcrumb } from "@sushindustries/ui";

const items = [
	{ label: "Components", href: "/components" },
	{ label: "Accordion" },
];

export function Example() {
	return <Breadcrumb items={items} origin="https://sushindustries.com" />;
}
```

## What you should see

"Components" as a link, a chevron separator, then "Accordion" as plain
text with no underline - the last crumb is never a link, since it is the
page already being read. With `origin` set there is also a
`<script type="application/ld+json">` in the output carrying a
`BreadcrumbList`, invisible on the page but present in the source.

## If nothing happens

`Breadcrumb` returns `null` for an empty `items` array rather than an
empty `<nav>` - check the array actually has entries before assuming the
component is broken. Missing structured data in a page's source usually
means `origin` was left unset; it is optional, and without it the
component renders the visible trail only.
