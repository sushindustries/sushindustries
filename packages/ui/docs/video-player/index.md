---
title: Video Player
summary: A video held behind a picture of itself. The player is a child, so it mounts on play and unmounts on stop.
updated: 2026-08-17
---

Nothing about a video is expensive until somebody presses play, and every
embed on the market gets that backwards. A YouTube iframe is roughly a
megabyte of third-party JavaScript and a set of cookies, spent on arrival, on
a page most readers scroll past. Three in one document is three of those.

So this renders a poster and a button, and the player it is given does not
exist in the DOM until the button is pressed.

<!-- ::start:showcase demo="video-player" height="460" -->
<!-- ::end:showcase -->

## The player is a child

That is the whole reason this is installable. A component that owned its own
embed would own its vendor too: you could not use it without that vendor's
package, its account, or its network.

```tsx file=video.tsx
<VideoPlayer title="Never Gonna Give You Up" provider="youtube" poster={still}>
	<iframe src={embedUrl} title="Never Gonna Give You Up" allowFullScreen />
</VideoPlayer>
```

The shell is the component and the player is whatever you hand it: a Mux
player, a YouTube frame, a plain `<video>`. This file imports none of them and
cannot tell them apart, which is why the registry entry has no dependencies at
all.

## Stop is not pause

Pressing stop unmounts the player. Playback ends, the network goes quiet, and
the third party stops watching. A pause button leaves all three running, which
is why this one says stop and means it.

Escape does the same thing, unless you are in fullscreen, where Escape already
means "leave fullscreen" and taking that over would be rude. A reader who has
pressed play, gone fullscreen, and pressed Escape twice is back on the page
with nothing running behind the text.
