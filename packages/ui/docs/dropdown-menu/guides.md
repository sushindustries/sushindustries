---
title: Guides
summary: Using Dropdown Menu well, and the mistakes that look like it is broken.
---

## Composing it

Items are data, not children. `onSelect` is handed the item's id and is not
called for a disabled one, so a caller never has to check. `buttonClassName`
replaces the button's classes outright, which is how the same menu becomes an
icon in a table cell.

```tsx
<DropdownMenu
	label="Actions"
	buttonClassName="btn btn-quiet btn-icon"
	align="end"
	items={rows.length ? actions : []}
	empty="Select a row first."
	onSelect={run}
/>
```

An empty `items` says so in the menu rather than by leaving a button that does
nothing, or by a button that is not there at all.

## Which edge it lines up with

Position is measured on `beforetoggle`, while the popover is still closed and
already measurable, so the menu is placed before the first frame it is visible
in. It flips above the button when there is no room below and is clamped into
the viewport sideways.

| `align` | Lines up | For |
| --- | --- | --- |
| `start` (default) | The menu's left edge with the button's left edge | A menu under a control on the left of its row |
| `end` | The two right edges | The last column of a table, where a left-aligned menu would hang off the page |

## What the platform does, and what is left

Four of the things a menu needs are already in the browser, and are done better
there than a component can do them:

| The browser's | What it means here |
| --- | --- |
| The top layer | Over every stacking context, without a z-index war |
| Light dismiss | A click anywhere else closes it |
| Escape | Closes it, and returns focus to the invoker |
| One at a time | Opening another `popover="auto"` closes this one |

What is left is placement and the arrow keys. That is the whole component, and
it is why it has no dependency beyond `Icon`. Not CSS anchor positioning, which
would delete the placement code and is Chromium-only - a menu that lands in the
top left corner in Safari is not a progressive enhancement.

## When not to use it

`ContextMenu` is the other half of this idea and is not interchangeable with
it: that one opens at a pointer from a right-click or a long press. This one
opens from a control somebody clicked on purpose, which is what makes it
reachable by keyboard from that control.

`destructive` is colour only and confirms nothing. An action that needs a
second look needs a `Dialog`, and this menu is not one.
