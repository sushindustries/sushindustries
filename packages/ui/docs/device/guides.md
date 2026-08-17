---
title: Guides
summary: Using Device well, and the mistakes that look like it is broken.
---

## Choosing one by hand

```tsx
<Device kind="tablet">{...}</Device>
```

Every generated rule is written twice for this: once under its media query for
`.device:not([data-device])`, once as `.device[data-device="tablet"]` with no
query at all. The two selectors tie on specificity, the attribute forms come
last, and so a choice beats a width.

That is what a settings panel writes, and it is how a showcase can put all
three on one page.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## The 3D, and which element carries what

Three flat elements laid out in space. Two properties do the work and putting
either on the wrong element breaks the illusion in a way that is hard to name
and easy to see.

<!-- ::start:grid min="15rem" gap="4" -->

**`perspective`** goes on the outer stage. One vanishing point for the whole
machine. On the body instead, the body gets its own and the deck stops agreeing
with it about where the viewer is standing.

**`transform-style: preserve-3d`** goes on the body, so the screen inside it
stays in the same space rather than being flattened into a picture of itself.

**`rotateX`** is the tilt, and it is the only reason the perspective has
anything to do. At zero this is an ordinary rectangle and the entire 3D stage
is dead weight.

**`translateZ`** orders the screen and the back panel. Inside `preserve-3d`,
paint order comes from 3D position rather than from the DOM.

<!-- ::end:grid -->

The lens is longer on a laptop (1400px) than on a phone (1100px), which is the
same instinct as a photographer's: the machine should look like it is being
looked at, not like it is being photographed from six inches away.

> [!CAUTION] The back panel must never be clickable
> `.device-back` is `inset: 0` over the whole body and comes *after* the screen
> in the DOM. The only thing keeping it behind is `preserve-3d` honouring its
> `translateZ(-2px)`, and any ancestor that flattens the 3D context - a filter,
> an overflow, a browser quirk - puts it on top, where it silently swallows
> every click on the screen and looks completely fine doing it.
>
> That happened. It is why the panel carries `pointer-events: none` as well.

## The screen is a container

`.device-screen` declares `container-type: inline-size`, so everything inside
sizes against the screen rather than against the window.

That is the difference between the machine being a frame and being a costume. A
tablet chosen on a wide monitor is 40rem of screen inside a 1600px window; a
`@media` query would give its contents a laptop's spacing, which is the exact
thing choosing a tablet was meant to avoid.

```css
.device-desktop {
	padding: clamp(var(--s-3), 3cqi, var(--s-4));
}
```

## It does not animate open

It used to, on scroll. The lid rose as you reached it.

A frame around real controls should not make you wait to reach them, and this
one is full of real controls - folders that open, windows that drag, a dock.
The animation was a thing you sat through before the screen became readable,
and it ran again every time somebody scrolled back up.

## Props

| Prop | Type | What it does |
| --- | --- | --- |
| `children` | `ReactNode` | The desktop. Scrolls on its own and chains at the end. |
| `kind` | `DeviceKind` | Overrides the width. Omit and the stylesheet decides. |
| `wallpaper` | `ReactNode` | Behind the desktop, and never in the way of a click. |
| `title` | `string` | In the strip at the top of the screen. |
| `toolbar` | `ReactNode` | Also in the strip, right-aligned. |
| `dock` | `ReactNode` | Pinned along the bottom, below the scrolling desktop. |

The dock is a child of the *screen*, not of the desktop, so anything it opens
is measured against the screen and clipped by the screen. Inside the desktop it
would be measured against a scrolled box and cropped by it, which is a bug that
looks like a rendering glitch and is really a containing block.

## No window controls

Deliberately not three coloured dots. Those are one vendor's furniture, they
mean close, minimise and zoom, and none of those three things can happen to
this. Drawing controls that do nothing is worse than drawing none.

The windows *inside* the screen do have those actions, and they have real
buttons for them. See `DeskWindow`.

## Where this is used

| Where | What |
| --- | --- |
| The home page | with `FolderShelf` on the screen and a `Dock` along the bottom |
| `packages/atoms/devices.md` | the three machines, as a table |
| `packages/atoms/src/devices.css` | generated. The widths, as media queries |
| `packages/ui/src/device-kinds.ts` | generated. The same widths, as values |
| `useDeviceKind` | for code that has to *name* the machine rather than draw it |
