---
title: Get Started
summary: Render Credit once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Credit } from "@sushindustries/ui";

export function Example() {
	return (
		<Credit
			name="TanStack Start"
			by="Tanner Linsley and contributors"
			href="https://tanstack.com/start"
			role="The framework this site runs on"
			logo="/logos/tanstack.svg"
			docs="https://tanstack.com/start/docs"
		/>
	);
}
```

## What you should see

A card that is one big link to `href`, opening in a new tab: the project's
own mark and name on the left, the author's name truncating first if the row
runs out of room, and the role underneath. With `docs` set, a small "Docs"
chip sits over the corner as a second, separate link.

## If nothing happens

The card always renders something, even with only `name`, `by`, `href` and
`role` set - `logo` and `docs` are the only optional pieces. If the author
name is getting clipped when the project name is not, that is correct: the
name never truncates, the author line does.
