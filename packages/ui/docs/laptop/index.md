---
title: Laptop
summary: A laptop frame in CSS 3D, with a real, usable screen inside it.
---

The desktop on the home page is this. What is on the screen is ordinary markup
you can click, focus and scroll.

<!-- ::start:showcase demo="laptop" height="520" -->
<!-- ::end:showcase -->

## Two properties, on the right elements

```css
.laptop {
	perspective: 1400px;
}

.laptop-lid {
	transform: rotateX(-4deg);
	transform-style: preserve-3d;
}
```

That is the whole frame. Everything else is a border, a gradient and a shadow.

| Property | On | Why not elsewhere |
| --- | --- | --- |
| `perspective` | the stage | One vanishing point for the whole machine. On the lid, the lid gets its own and stops agreeing with the base about where you are standing |
| `transform-style: preserve-3d` | the lid | Keeps the screen in the same 3D space. Without it the screen flattens to a picture the moment the lid tilts |

`-4deg` is a lid leaning very slightly back, which is how an open laptop sits.
Zero would be a rectangle, and the tilt is the only reason the perspective has
anything to do.

`1400px` is a long lens. The machine should look like it is being looked at,
not photographed with a wide angle from six inches away.

## It does not animate open

It used to. The lid rotated up from shut as you scrolled to it, driven by
`useScrollProgress`.

It is gone, and the reason is worth keeping: the screen was unreadable until
the animation finished and unusable while it ran. A frame around real controls
should not make you wait to reach them. An open laptop is a laptop you can
start reading.

The hook it used is still there and still worth having - it just should not be
driving the thing you came to use.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## The screen is real

This is the part that decides whether it is a component or a picture.

Inside the lid is a scroll container with real buttons, real links and real
focus order. It has `overscroll-behavior: contain`, so a flick that reaches the
bottom of the desktop stops there instead of throwing you down the article - on
a phone that is the difference between a screen you can use and one that fights
you.

## On a phone it stops being 16:10

At 320px a 16:10 lid is 200px tall, which is not a desktop anybody can use. So
below 620px the aspect ratio gives way to 3:4 and the perspective shortens.

It looks slightly less like a laptop and becomes usable, which is the right way
round. A device frame that cannot be operated on a device is a drawing.

## Search

`FolderShelf` renders its own search field, which lands in the strip area of
the screen. It looks past the folders and matches the things inside them,
because somebody typing into a desktop is looking for a file and not for the
drawer it is in - and each result says which folder it came from, which is the
difference between a name and an answer.

## Where this is used

| Where | Holding |
| --- | --- |
| The home page | `SiteShelf`, which is `FolderShelf` over `content/shelf.md` |
| `apps/web/src/styles/prose.css` | `.desk-glow`, this site's wallpaper |

`wallpaper` is a prop, so the machine does not know what is behind its own
folders. This site passes two soft radial gradients rather than an image: an
image is a request, a decode and a decision about resolution, for something
behind a folder grid that nobody looks at directly.
