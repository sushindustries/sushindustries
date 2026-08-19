---
title: Workbench API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | The body. Scrolls on its own; the page does not scroll with it. |
| `title?` | `string` | - | In the strip at the top. Small, monospaced, the name of the surface. |
| `toolbar?` | `ReactNode` | - | Also in the strip, right-aligned. Search, filters, a menu, a count. |
| `rail?` | `ReactNode` | - | A column down the left of the body. Navigation, a tree, a filter list. |
| `status?` | `ReactNode` | - | Pinned along the bottom. Counts, a revision, when it last refreshed. |
| `maxHeight?` | `string` | - | How tall the body is allowed to grow before it scrolls. A CSS length. Left off, the body is as tall as its content and nothing scrolls - which is right for a short table and wrong for a browser over a database, so the caller decides rather than a default guessing. |
| `label?` | `string` | - | Announced as a region with this name, for anyone navigating by landmark. |
| `variant?` | `"machine" \| "panel" \| "bare"` | `"machine"` | How much frame to draw. `machine` is the case and the sunken screen - an object sitting on the page, which is right when the workbench *is* the page's content. `panel` is one border and no case. It exists because the case is a second material, and a second material inside a first one reads as a surface floating on a surface - so a workbench inside a card, a dialog or another workbench wants this rather than the full machine. `bare` is the layout with no frame at all: the strip, the rail, the scrolling body and the status line, and nothing drawn around them. For a workbench that fills its container edge to edge, where a border would be a line against the window. All three are the same markup. Only the case and the screen change, which is what keeps the choice cosmetic rather than structural - switching variants can never move a slot or break a scroll container. |

<!-- /generated:api -->

## Notes

Anything the types cannot say: which combinations are meaningless, which
prop is ignored when another is set, and what it does when handed
something it cannot render.
