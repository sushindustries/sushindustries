---
title: Context Menu
summary: One menu, reachable by right-click, by long press, and by a button that is always there.
---

<!-- ::start:showcase demo="context-menu" height="400" -->
<!-- ::end:showcase -->

## Three doors to the same room

Right-click is the interaction people ask for and the one fewest people can
perform. A menu that is *only* reachable that way does not exist on a phone,
does not exist for anyone navigating by keyboard, and does not exist for
someone on a trackpad who has never found secondary click.

| Door | Who uses it |
| --- | --- |
| Right-click | pointer, and it is what people expect of an icon |
| Long press, 450ms | touch and pen. `pointerType` is checked, because a held mouse button is a drag, not a long press |
| A visible button | everyone else, including every keyboard user |

The button is the important one, and it is **always visible** rather than
revealed on hover. A control that only exists while a pointer is over it does
not exist on a touch screen at all.

> [!IMPORTANT] The long press cancels on movement
> A press that turns into a drag is a scroll. Without the cancel, a menu opens
> in the face of anyone who scrolls the page with their thumb on a folder.

## Keyboard

Arrow keys move between items, Home and End jump to the ends, Escape closes,
and the first item is focused when the menu opens - not the container, because
a menu that opens with nothing focused costs an extra keypress before the
arrows do anything.

That roving focus is fifteen lines of local `onKeyDown` rather than a hotkey
library. A menu's arrow keys are scoped to the menu; a global hotkey manager
would fire while focus was anywhere on the page, which is the wrong shape and a
dependency in every consumer's install.

## Placing it

`position: fixed` at the pointer, clamped to the viewport with an 8px margin so
it never opens off-screen.

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

## Actions are the consumer's

```tsx
const menu = useContextMenu();

<div {...menu.triggerProps}>
	<button {...menu.buttonProps}>Actions</button>
</div>

<ContextMenu state={menu} actions={actions} />
```

`MenuAction` is an id, a label, an optional glyph and hint, and an `onSelect`
that may be async. This component knows how to summon a menu and where to put
it; it does not know what "save as Markdown" means and should not.

## Where this is used

| Where | Actions |
| --- | --- |
| `FolderShelf` tiles and rows | supplied by `actionsFor` |
| The home page desktop | `apps/web/src/modules/chrome/shelf-actions.ts` |

Those actions are worth reading as an example of degrading rather than hiding:
the share sheet is not on most desktop browsers and the clipboard is not
available over plain HTTP, and neither is a reason to remove a menu item. Each
falls back to the thing the reader would have done by hand.
