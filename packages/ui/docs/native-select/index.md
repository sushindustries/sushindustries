---
title: Native Select
summary: The platform's own select in the site's clothes - the phone wheel and the OS menu, kept.
updated:
---

A native `<select>` restyled to match the site's fields, with a drawn-on
chevron replacing the one `appearance: none` removes. Reach for it for any
fixed set of options where the platform's own picker is welcome.

<!-- ::start:showcase demo="native-select" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Opening it hands off entirely to the platform: the OS menu on desktop, the
wheel on iOS, the sheet Android draws for `<select>`. That handoff is the
whole argument for it over a listbox rebuilt in divs, and it is also why only
the closed state is this component's to style - the chevron replaces the one
`appearance: none` takes away along with the browser's own styling.

## What it does not do

It cannot show more than text in an option - no icon, no description, no
price next to a label - because the OS renders the popup and only reads the
option's text. Multiple selection and in-page search are out for the same
reason: there is no listbox here to replace a native `<select>` with.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
