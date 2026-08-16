---
title: Doc Aside
summary: An on-page table of contents that is a rail on desktop and a collapsed row on mobile.
---

Every heading in this page's sidebar comes from the Markdown itself. There is
no list to maintain — write an `h2` and it appears.

## What it does

A sticky rail beside the prose on desktop, a narrower rail on tablet, and one
collapsed row above the article on a phone. A contents list that pushes the
article down by ten lines is worse than no contents list.

## Why the collapse is CSS

The mobile toggle is a checkbox and a label, not React state. A contents list
is the first thing a reader reaches for on a phone, and one built from state
does not work until hydration — which on a long document is exactly when it is
least likely to have happened.

The same markup is a plain list on desktop, because CSS hides the control
rather than the component rendering something different.

## The last heading problem

The highlight is computed from scroll position, not an `IntersectionObserver`,
and that is not a preference.

An observer with a top-band root margin never fires for the final heading: a
short last section means the page runs out of scroll before that heading
reaches the band, so the last item in the list can never highlight no matter
how far down you go.

Reading positions directly makes the case expressible — at the bottom of the
document, the last heading is what you are looking at, whether or not it
crossed the line.

> [!TIP] Scroll to the bottom of this page
> The last item in the sidebar highlights. That is the bug this component
> exists to not have.

## Accessibility

The checkbox is `sr-only`, not `display: none`, so it stays focusable and
announced — only its default appearance is hidden. Links carry
`aria-current="location"` when active, and the mobile targets are 44px tall.
