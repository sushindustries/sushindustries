---
title: Get Started
summary: Render Avatar once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Avatar, AvatarGroup } from "@sushindustries/ui";

export function Example() {
	return (
		<>
			<Avatar name="Ada Lovelace" tone="motion" />
			<AvatarGroup
				people={[
					{ name: "Ada Lovelace" },
					{ name: "Grace Hopper" },
					{ name: "Katherine Johnson" },
				]}
				max={2}
			/>
		</>
	);
}
```

## What you should see

A circle with "AL" centred inside it, on the `motion` tone's fill - no
`src` was given, so the fallback is what's showing, not a broken state.
The group below shows two overlapping circles ("AL", "GH") and a third
circle reading "+1", since `max={2}` was passed against three people.

## If nothing happens

An avatar that never shows an image even with `src` set usually means the
request failed after the first render - check the network tab for a 404
or a CORS error, since a failed `<img>` load is exactly what triggers the
initials fallback. A blank circle with no letters means `name` was an
empty string; initials come only from words `name` actually contains.
