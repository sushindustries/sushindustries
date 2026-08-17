---
title: Video Player API
summary: Every prop, and the block attributes that map onto them.
---

## Props

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `title` | `string` | required | What the video is. Used three times: the poster's alt text, the caption, and the button's accessible name. "Play" alone tells a screen-reader user nothing on a page with four of these. |
| `provider` | `"youtube" \| "mux" \| "file"` | `"file"` | Only ever a data attribute and a label. Nothing in the component behaves on it. |
| `poster` | `string` | none | The still. Without one the frame is a plain ground and the title. |
| `variant` | `"inline" \| "cinema" \| "card"` | `"inline"` | Rendered as `data-variant`, never a modifier class. |
| `ratio` | `string` | `"16 / 9"` | CSS aspect ratio for the reserved box. The one thing set inline, because an author's ratio is data and no token can hold an arbitrary one. |
| `caption` | `ReactNode` | none | A line under the frame. The title is already shown; this is the rest. |
| `sourceLabel` | `string` | the provider's name | The badge on the poster, so a reader knows who is about to be asked for bytes. |
| `active` | `boolean` | uncontrolled | Pass it with `onActiveChange` to let a host enforce one playing video per page. |
| `onActiveChange` | `(active: boolean) => void` | none | Fires in both modes, so a host can coordinate without taking ownership. |
| `children` | `ReactNode` | none | The real player. Mounted only while active, so stopping unmounts it. |

## Block attributes

The Markdown block takes the same set as strings:

| Attribute | Maps to | Notes |
| --- | --- | --- |
| `provider` | `provider` | Anything other than `youtube` or `mux` is treated as `file`. |
| `id` | the player | The YouTube id or the Mux playback id. |
| `src` | the player | The URL, for `file`. One of `id` or `src` is required; without either the block says so rather than rendering an empty frame. |
| `title` | `title` | |
| `poster` | `poster` | Defaults to the provider's own still. |
| `variant` | `variant` | |
| `ratio` | `ratio` | |
| `caption` | `caption` | |
| `captions` | a `<track>` | A WebVTT URL. `file` only: a cross-origin iframe cannot be given one. |

## State

Uncontrolled unless both `active` and `onActiveChange` are passed. The
component reads `active ?? ownActive`, so a host that passes only the callback
still gets told about every change while the component keeps its own state.

## Accessibility

The poster is a `<button>` covering the whole frame, not a div with a click
handler and not a small button floating over a picture: the whole still is the
target, and the keyboard and the screen reader come for free. The wrapper is a
`<figure>` with a `<figcaption>`, so the caption is associated with the media
by the element choice rather than by an ARIA attribute.
