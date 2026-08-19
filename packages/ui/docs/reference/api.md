---
title: Reference API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `reference` | `Reference` | - | The target, resolved by the caller. The card is built from this, never fetched. |
| `children` | `ReactNode` | - |  |

<!-- /generated:api -->

## Notes

`reference` is never re-derived from `children` - the two are independent.
Passing `children` that don't match `reference.title` (calling it "the
pagination component" while linking a `Reference` titled "Pagination") is
legal and renders exactly that mismatch; nothing checks them against each
other.

Nesting a `Ref` inside another link, or inside another `Ref`, isn't
handled - anchors don't nest in valid HTML, and the browser's own parsing
behaviour decides which one wins, not this component.
