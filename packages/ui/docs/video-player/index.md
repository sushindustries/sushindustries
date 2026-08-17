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

## What the buttons actually do

| Control | What it does | Why it is honest |
| --- | --- | --- |
| Play | Mounts the player | The first byte of the vendor is spent here and nowhere earlier |
| Stop | Unmounts it | Ends playback, the requests and the cookies together |
| Fullscreen | `requestFullscreen` on the stage | Asked of an element this component owns, so it works the same for an iframe nobody can reach into and a `<video>` with its own controls |

There is deliberately no mute or volume control. Neither can be done to a
cross-origin iframe, and a button that works for one provider and silently
does nothing for another is worse than no button.

## Variants

Three, as data attributes rather than modifier classes:

- `inline` sits in the prose column.
- `cinema` breaks that column on a screen wide enough to have room. Only above
  900px, because below it the negative margins would pull the frame off the
  side of a phone.
- `card` is the compact one, for a grid cell beside two others.

<!-- ::start:grid columns="3" gap="4" -->

<!-- ::start:card title="inline" icon="text" tone="content" -->
The default. Same width as the paragraph above it.
<!-- ::end:card -->

<!-- ::start:card title="cinema" icon="layers" tone="layout" -->
Wider than the prose on a desktop, identical to inline on a phone.
<!-- ::end:card -->

<!-- ::start:card title="card" icon="grid" tone="docs" -->
Compact, with a smaller play target and a tighter caption.
<!-- ::end:card -->

<!-- ::end:grid -->

## In Markdown

On this site it is a block, so a page can hold one without a line of TSX:

```md file=post.md
<!-- ::start:video provider="youtube" id="dQw4w9WgXcQ" title="Never Gonna Give You Up" variant="cinema" -->
<!-- ::end:video -->
```

`provider` is `youtube`, `mux` or `file`. `id` is the YouTube id or the Mux
playback id; `src` is the URL for a file. The block supplies the player and
this component supplies everything around it.

Mux is the one to reach for when the video is yours: `@mux/mux-player-react`
is loaded by the click that needs it, gets adaptive bitrate and its own
analytics, and needs no cookie banner for a poster nobody pressed.

> [!NOTE] The poster is the one thing that can still be third party
> Defaulting to `i.ytimg.com` or `image.mux.com` is a fraction of the player
> it replaces and carries no script, but it is still a request. Pass `poster`
> and host the still yourself if that matters to you.

## One at a time

The component does not enforce it, because a component cannot see its
siblings. Pass `active` and `onActiveChange` and the host can: on this site a
TanStack Store holds the id of whichever video is mounted, and each block
compares it to its own. Starting the second stops the first, and the reader
never has to go looking for a video they can hear and cannot find.
