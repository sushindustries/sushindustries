---
title: Guides
summary: Using Workbench well, and the mistakes that look like it is broken.
---

## Composing it

Every slot is optional except `children`. Each of `title`, `toolbar`, `rail`
and `status` adds furniture without moving anything already there, so a page
can start with a body and grow the rest as it needs them.

```tsx
<Workbench
	title="documents"
	label="Every document in the index"
	toolbar={<Button>New</Button>}
	rail={<KindFilters />}
	status={
		<span className="workbench-stat">
			<b>50</b> of <b>1,240</b>
		</span>
	}
	maxHeight="24rem"
>
	<Rows />
</Workbench>
```

The rail is a sibling of the body rather than a block inside it, so it stays
put while the body scrolls. A filter list that scrolls away is the one thing a
filter list must not do, because it is what you reach for after scrolling.

## The three variants

All three are the same markup and differ only in how much frame is drawn, so
switching between them can never move a slot or break the scroll container.

| `variant` | Draws | Reach for it when |
| --- | --- | --- |
| `machine` (default) | The case, with the screen sunk into it | The workbench is the page's content and should read as an object on it |
| `panel` | One border, no case | It sits inside a card, a dialog or another workbench - a second material inside a first reads as a surface floating on a surface |
| `bare` | The layout and nothing around it | It fills its container edge to edge, where a border would be a line drawn against the window |

## The rail folds on the panel, not the window

`.workbench` is a named container, so the rail moves above the body at 46rem of
panel width rather than of viewport width. One in a sidebar and one filling a
page then behave the same at the same size, which a media query cannot express
because it is asking a different question.

## Scrolling is handed back to the browser

The body carries `data-lenis-prevent`, so a smooth-scroll driver that has taken
over wheel and touch for the document lets go inside it. Without that, dragging
in the panel animates the page behind it. The attribute is inert for anyone not
running one.

## When not to use it

Use `Device` when the point is to show something off. A tilt, a perspective and
a lid-shaped aspect ratio are exactly wrong for a surface somebody sits in
front of: the ratio crops real content to the shape of a laptop, and text on a
rotated plane is text that is slightly blurred all day.
