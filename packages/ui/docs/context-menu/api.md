---
title: Context Menu API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `state` | `ContextMenuState` | - | What `useContextMenu` returns. One hook per menu - two menus sharing one state open together. |
| `actions` | `readonly MenuAction[]` | - | The rows, in order. Choosing one closes the menu before running it. |
| `label?` | `string` | `"Actions"` | Named for screen readers, since the menu itself has no visible title. |

<!-- /generated:api -->

## Notes

`state` has to come from `useContextMenu` - one hook call per menu. Two
`ContextMenu`s sharing one hook's return value open and close together, since
the state (open, position, id) is shared, not per-instance.

`MenuAction.onSelect` may return a promise; it is awaited with `void`, so a
slow action does not block the menu from closing. It closes immediately on
selection either way - there is no way to keep the menu open across an
action, by design: a menu that lingers after a choice looks like the choice
did not register.
