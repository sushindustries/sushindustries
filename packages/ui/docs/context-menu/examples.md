---
title: Examples
summary: Context Menu in something real, at every width it has to survive.
---

<!-- ::start:showcase demo="context-menu" height="400" -->
<!-- ::end:showcase -->

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
