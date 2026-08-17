---
title: Folder Shelf API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `entries` | `readonly ShelfEntry[]` | - | The whole tree. The top level is the desktop; the rest appears once a window opens onto it. |
| `actionsFor?` | `(entry: ShelfEntry, path: readonly ShelfEntry[]) => MenuAction[]` | - | The menu for an entry, built by the consumer. This component knows how to summon a menu and where to put it. It does not know what "save as Markdown" means, and it should not: the actions are about the host's content, and a shelf that hard-coded them could only ever list one kind of thing. |
| `query?` | `string` | `""` | Text in the search window's field. Controlled by the consumer. |
| `onQuery?` | `(query: string) => void` | - | Every keystroke in that field. Without it the field cannot be typed into. |
| `onChoose?` | `(entry: ShelfEntry, path: readonly ShelfEntry[]) => void` | - | What a search result does when chosen. |
| `renderEntry?` | `(entry: ShelfEntry) => ReactNode` | - | Renders a leaf's page, to be shown in a window rather than navigated to. Return nothing and the leaf stays a link, which is the right default - this component has no idea what is at the other end of an href. Return something and the desktop stops being a directory of somewhere else and becomes the place the content is. |
| `renderLink?` | `(props: { id: string; href: string; className: string; children: ReactNode; }) => ReactNode` | `(props) => <a {...props} />` | Renders the link for an entry that has an href. |
| `label?` | `string` | `"Folders"` | Announced to screen readers as the name of the shelf. |
| `rememberAs?` | `string` | `"sushindustries.desk"` | Storage key for the arrangement: which windows are open, where they sit, and what has been put away. Only used when `desk` is not supplied. |
| `desk?` | `DeskApi` | - | An existing desk to render, rather than one of its own. Supply this whenever something outside also needs to open, close or list windows - a dock, most obviously. Two `useDeskState` calls with the same storage key are not one desk shared: they are two Reacts states that happen to write to the same place, so opening a window through one leaves the other still rendering the desk it last knew about. That is not hypothetical. The dock's search button wrote to the site's desk and the shelf kept rendering its own, so pressing search added a task to the dock and put no window on screen. |
| `columns?` | `number` | `4` | How many cells across the desktop is. Passed rather than measured, so the server and the client agree about the arrangement on the first paint. On this site it comes from `devices.md` via `useDeviceKind`, which is the same table the stylesheet's `--device-columns` is compiled from. Only the top-level shelf uses it. Icons inside a window are never placed, so a window never needs to know. |

<!-- /generated:api -->

## Notes

Anything the types cannot say: which combinations are meaningless, which
prop is ignored when another is set, and what it does when handed
something it cannot render.
