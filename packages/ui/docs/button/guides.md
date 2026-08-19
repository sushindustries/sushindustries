---
title: Guides
summary: Using Button well, and the mistakes that look like it is broken.
---

## When not to use it

There are exactly two variants and no way to add a third - a row that
wants a primary, a secondary and a tertiary action is a row that has not
decided what actually matters on that screen. If a project genuinely
needs a third weight, that is a sign the section has too many equally
important actions, not a missing prop.

## href decides the element, not just the look

`href` swaps the rendered tag from `<button>` to `<a>` - it is not a
style switch. That matters for anything reading the DOM rather than the
pixels: a link-shaped action is in the browser's navigation history and
works with open-in-new-tab, a button-shaped one is not. Pass `href` for
anything that changes the URL, and `onClick` for anything that does not,
rather than reaching for `onClick` with a manual `window.location`
inside it.
