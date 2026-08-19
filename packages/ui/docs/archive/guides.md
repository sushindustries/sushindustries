---
title: Guides
summary: How to hand Archive a typed router's links, and why every card is the same shape whether or not it has a picture.
---

## Routing stays yours

`renderLink` gets `kind` and `id` alongside a plain `href`:

```tsx
renderLink={({ kind, id, className, children }) =>
	kind === "item" ? (
		<Link to="/components/$slug" params={{ slug: id }} className={className}>
			{children}
		</Link>
	) : (
		<Link to="/components" search={{ category: id }} className={className}>
			{children}
		</Link>
	)
}
```

> [!CAUTION] A typed router needs the pattern, not the path
> This is why `kind` and `id` exist rather than just `href`. Handing TanStack
> Router's `Link` an already-resolved `/components/reveal` produces an anchor
> with the right href whose click is intercepted and then silently fails to
> match `/components/$slug` - so every card looks like a link and does
> nothing. Seven of ten cards did exactly that before the callback carried the
> parts instead of the result. `href` stays for hosts that just want an anchor.

## Cards are the same shape regardless of content

Previews are 16:9 and clipped, centred in their frame. Without that, a grid of
ten components is ten screenshots of different sizes rather than a set, and the
eye reads the variation as meaning something.

```css
.archive-preview {
	aspect-ratio: 16 / 9;
	display: grid;
	place-items: center;
	overflow: hidden;
}
```

`previewSrc` is optional, because not everything is visual: a frontmatter
parser has nothing to show, and a card that insists on a picture would invent a
meaningless one. Items without it get their `preview` sentence instead, which
is also what a screen reader gets for the ones that do.
