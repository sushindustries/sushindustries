---
title: Breadcrumb API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `items` | `readonly BreadcrumbItem[]` | - | In order, root first. The last item is the current page. |
| `origin?` | `string` | - | Absolute site origin for the JSON-LD `item` URLs. Omit to skip the structured data and render only the visible trail. |

<!-- /generated:api -->

## Notes

`origin` should be the site's own absolute origin, not a per-page value -
anything else produces `item` URLs in the JSON-LD that do not match the
page's real address, which search engines flag as inconsistent
structured data. An item with no `href` renders as the current page
regardless of its position in the array, not only when it is last.
