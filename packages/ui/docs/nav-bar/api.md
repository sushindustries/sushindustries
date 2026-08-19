---
title: Nav Bar API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `brand` | `ReactNode` | - | The mark at the left. Already wrapped in a link, so do not pass an anchor. |
| `brandHref?` | `string` | `"/"` | Where the mark leads. |
| `entries` | `readonly NavEntry[]` | - | The top row. An entry with `items` becomes a panel, one without stays a plain link. |
| `trailing?` | `ReactNode` | - | Right-hand side. Usually one external link. |
| `menuLabel?` | `string` | `"Menu"` | Label on the mobile toggle, for screen readers. |
| `renderLink?` | `(props: { href: string; className: string; children: ReactNode; }) => ReactNode` | `(props) => <a {...props} />` | Rendered around every href, so a router can own navigation. |

<!-- /generated:api -->

## Notes

Whether an entry becomes an expandable panel or stays a plain link is decided
by the entry's own shape, not by a prop here - one with `items` gets a panel,
one without stays a link. There is no separate flag to set wrong.

`renderLink` is optional because the component works with plain anchors on
its own; pass it only when a client-side router needs to intercept the click.
Without it, every navigation - including inside an open panel - is a full
document load.

The panels are `<details>`/`<summary>`, not React state, so they open, close
and announce themselves as expandable before hydration finishes. That is
also why closing on an outside click or a link press needs its own handling:
`<details>` has no built-in notion of either, so the component adds both by
hand rather than getting them from the element for free.
