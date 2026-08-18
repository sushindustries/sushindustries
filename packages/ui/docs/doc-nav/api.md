---
title: Doc Nav API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `sections` | `readonly DocNavSection[]` | - | The sections, in the order given. Collect them in a route loader, not here. |
| `active?` | `string` | - | The item that is open, so it can be marked and scrolled to. |
| `label?` | `string` | `"Library"` | Heading on desktop, button text once the rail is a collapsed row. |
| `renderLink` | `(props: { id: string; href: string; className: string; "aria-current"?: "page"; children: ReactNode; }) => ReactNode` | - | Renders each link, so the host can use its router's Link. `id` is passed alongside the plain href because a typed router needs the route pattern and its params, not a path that has already been resolved - handing `Link` a resolved `/components/reveal` gets an anchor with the right href whose click is intercepted and then silently fails to match `/components/$slug`. The href stays for hosts that just want an anchor. |

<!-- /generated:api -->

## Notes

`sections` is `DocNavSection[]`, and a section is `{ id, label, icon?, items }`
where an item is `{ id, label, href }`. `icon` is an `IconName`, so a section
with no glyph is one that omits the key rather than one that passes an empty
string.

An `active` that matches no item is not an error. Nothing is marked and the
rail does not scroll, which is the right answer for a page that is inside the
library but is not one of its elements.

Sections with no items are dropped before rendering, and a set where every
section is empty renders nothing at all - so a rail waiting on its data leaves
no empty box behind.
