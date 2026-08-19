---
title: Get Started
summary: Render Button once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Button } from "@sushindustries/ui";

export function Example() {
	return (
		<>
			<Button href="/get-started">Get started</Button>
			<Button variant="ghost" onClick={() => console.log("clicked")}>
				Learn more
			</Button>
		</>
	);
}
```

## What you should see

A solid pill with a shadow that lifts slightly on hover, next to an
outlined pill with no fill. Both are the same height and shape - `variant`
changes weight, not size. Because the first has `href`, it renders as an
`<a>`; the second has no `href`, so it renders as a real `<button>`.

## If nothing happens

`onClick` is silently dropped whenever `href` is also set - the anchor
navigates and the handler never runs, which is intentional rather than a
bug to work around. A button that looks disabled but still responds to
clicks means `disabled` was set on a link: `href` cannot be disabled, and
the prop only reaches the `<button>` element.
