---
title: Get Started
summary: Render Empty once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Button, Empty } from "@sushindustries/ui";

export function Example() {
	return (
		<Empty
			title="No posts yet"
			icon="note"
			action={<Button variant="ghost">Write one</Button>}
		>
			Drafts stay off the index until they say otherwise.
		</Empty>
	);
}
```

## What you should see

A quiet block, centred: an icon, the title in bold, one line of explanation
under it, and the action last. Nothing here does anything on its own -
`action` is whatever you pass, this component only places it.

## If nothing happens

`Empty` always renders something, including with no `children` and no
`action` - `icon` defaults to `folder-open` rather than disappearing, since a
bare title with no glyph reads as a failed render rather than an intentional
empty state.
