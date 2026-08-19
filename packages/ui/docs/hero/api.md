---
title: Hero API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `variant?` | `"doc" \| "landing"` | `"doc"` | Which job this hero is doing. `landing` is the top of a home page: full height, the mark beside the sentence, one action and one alternative. `doc` is the head of a documentation page. They share the split, the actions row and the wrap order, and differ in height and type scale - which is why they are one component with an attribute rather than two components. |
| `trail?` | `ReactNode` | - | Above the heading. A breadcrumb, usually. |
| `name?` | `string` | - | The element's own id, rendered as `<name>`. A component in this library is a tag before it is a page, and writing it the way it is written in markup is the shortest true description of what the reader has arrived at. When it is absent the heading falls back to `title`, which is what a page that is not an element wants. |
| `title` | `string` | - |  |
| `version?` | `string` | - | Shown as a chip beside the heading. The element's version, not the package's. |
| `summary?` | `ReactNode` | - | One paragraph under the heading. Absent puts the facts straight beneath it. |
| `facts?` | `readonly HeroFact[]` | - | Keyed by `label`, so two facts cannot share one. Empty renders no list at all. |
| `actions?` | `ReactNode` | - | The one or two things to do here. Composed by the caller. |
| `shot?` | `HeroShot` | - | A picture of the thing, taken at each device width. |
| `media?` | `ReactNode` | - | Anything else for the second column - a 3D mark, a live frame, a chart. Ignored when `shot` is given, because a hero has one second column and two things fighting for it is a bug rather than a layout. |
| `children?` | `ReactNode` | - | Below everything, full width. The section tabs, usually. |

<!-- /generated:api -->

## Notes

`shot` and `media` share one second column, and `shot` wins when both are
given - a hero has one picture, not two fighting for the same space. Pass
whichever fits: `shot` for a captured image with a real `srcset`, `media` for
anything else that belongs there (a live frame, a 3D mark, a chart).

`name` and `title` are not the same field said twice. `name` renders as
`<name>` - the element's own identifier, for a component's own hero - and
falls back to `title` when absent. A page that is not an element (the home
page, a post) sets `title` alone.

`variant` changes height and type scale, not layout - `doc` and `landing`
share the split, the actions row and the wrap order. Reach for `landing` only
at the top of a page that stands in for the whole site; everywhere else,
`doc` is correct even when nothing else about the page is document-shaped.
