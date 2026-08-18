---
title: Guides
summary: Using Context Menu well, and the mistakes that look like it is broken.
---

## Keyboard

| Key | Does |
| --- | --- |
| `ArrowDown` | the next item, wrapping round to the first |
| `ArrowUp` | the previous item, wrapping round to the last |
| `Home` | the first item |
| `End` | the last item |
| `Escape` | closes the menu |

Disabled items are skipped, because the walk is over
`[role='menuitem']:not(:disabled)`. The first item is focused when the menu
opens - not the container, because a menu that opens with nothing focused costs
an extra keypress before the arrows do anything.

That roving focus is fifteen lines of local `onKeyDown` rather than a hotkey
library. A menu's arrow keys are scoped to the menu; a global hotkey manager
would fire while focus was anywhere on the page, which is the wrong shape and a
dependency in every consumer's install.

## Placing it

`position: fixed` at the pointer, clamped to the viewport with an 8px margin so
it never opens off-screen.

```ts
const margin = 8;

const x = Math.max(
	margin,
	Math.min(state.x, window.innerWidth - box.width - margin),
);
const y = Math.max(
	margin,
	Math.min(state.y, window.innerHeight - box.height - margin),
);
```

The clamp is why the coordinates live in state rather than being written as a
custom property on the trigger: the menu has to know its own width and height
before it can decide where it fits, and it only knows those after it renders.
The first frame at the raw point is the only one that can be wrong, and it is
never seen.

## Closing

Global listeners for `pointerdown`, `scroll`, `resize` and Escape. A menu that
only closes when you click the thing that opened it is a menu you have to
remember how to dismiss.

Presses inside the menu stop propagating, or the away-click listener would
close it before the item's own click ever fired.
