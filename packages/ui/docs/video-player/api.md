---
title: Video Player API
summary: Every prop, and the block attributes that map onto them.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `title` | `string` | - | What the video is. Required, and used three times: the poster's alt text, the caption under the frame, and the button's accessible name - "Play" alone tells a screen-reader user nothing on a page with four of these. |
| `provider?` | `VideoProvider` | `"file"` | Only ever a data attribute and a label. Nothing here behaves on it. |
| `poster?` | `string` | - | The still. Without one the frame is a plain ground and the title. |
| `variant?` | `VideoVariant` | `"inline"` | Rendered as `data-variant`, never a modifier class. |
| `theme?` | `VideoTheme` | `"auto"` | Forces the dark frame instead of following the page. `auto` is omitted rather than written, because a page full of `data-theme="auto"` says nothing and the selector wants a theme somebody chose. |
| `ratio?` | `string` | `"16 / 9"` | CSS aspect ratio for the reserved box, e.g. `16 / 9`. |
| `caption?` | `ReactNode` | - | A line under the frame. The title is already shown; this is the rest. |
| `sourceLabel?` | `string` | - | Where it is hosted, shown on the frame: "YouTube", "Mux". |
| `active?` | `boolean` | - | Controlled activation. Leave both out and the component owns its own state; pass them and the host can enforce one playing video per page. |
| `onActiveChange?` | `(active: boolean) => void` | - | Fires in both modes, so a host can coordinate without taking ownership. |
| `children?` | `ReactNode` | - | The real player. Mounted only while active, so stopping unmounts it. |

<!-- /generated:api -->

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
