---
title: Examples
summary: Video Player in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="video-player" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

This site's Markdown video block is what `active` and `onActiveChange` exist
for: a TanStack Store holds the id of whichever block is playing, so
starting a second video stops the first without either block knowing the
other exists.

```tsx
import { VideoPlayer } from "@sushindustries/ui";
import { useStore } from "@tanstack/react-store";
import { useId } from "react";
import { playingVideo, playVideo, stopVideo } from "./video.store";

export function VideoBlock({ id, title, poster, embedUrl }: BlockProps) {
	const blockId = useId();
	const playing = useStore(playingVideo);
	const active = playing === blockId;

	return (
		<VideoPlayer
			title={title}
			provider="youtube"
			poster={poster}
			active={active}
			onActiveChange={(next) => (next ? playVideo(blockId) : stopVideo(blockId))}
		>
			<iframe src={embedUrl} title={title} allowFullScreen />
		</VideoPlayer>
	);
}
```

`playVideo` and `stopVideo` write one id into the store; every block on the
page reads it and compares it to its own `useId()`, so the component itself
never needs to know how many siblings it has.

## What this example is not

The store (`playingVideo`, `playVideo`, `stopVideo`) is the site's own code,
not something `VideoPlayer` ships. Without it - passing no `active` at all -
the component is fully usable, just uncontrolled: each instance owns its own
open/closed state and two on one page can play at once.
