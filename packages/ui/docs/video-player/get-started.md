---
title: Get Started
summary: Render Video Player once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { VideoPlayer } from "@sushindustries/ui";

export function Example() {
	return (
		<VideoPlayer title="Never Gonna Give You Up" provider="youtube" poster={still}>
			<iframe
				src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
				title="Never Gonna Give You Up"
				allowFullScreen
			/>
		</VideoPlayer>
	);
}
```

## What you should see

A poster image in a rounded frame with a play disc over it and a small
"YouTube" badge in the corner - and no iframe anywhere in the DOM yet.
Nothing has been requested from YouTube. Press the disc and the iframe you
passed as `children` mounts and starts loading; press Stop underneath the
frame and it unmounts again, taking the network request with it.

## If nothing happens

If pressing play shows a blank frame instead of the video, the `children`
you passed is the problem, not this component - `VideoPlayer` never imports
or inspects a player, it only mounts whatever it was given. Check the
iframe's `src`, or the player package's own setup, first.
