---
title: Theme Toggle
summary: A segmented control that reports which option was pressed and knows nothing about themes.
---

<!-- ::start:showcase demo="theme-toggle" height="220" -->
<!-- ::end:showcase -->

```tsx
<ThemeToggle
	options={[
		{ id: "light", label: "Light", icon: "sun" },
		{ id: "dark", label: "Dark", icon: "moon" },
		{ id: "system", label: "System", icon: "contrast" },
	]}
	value={theme}
	onChange={setTheme}
/>
```

## It knows nothing about themes

It renders choices and reports which was pressed. It does not touch the
document, does not store anything, and has never heard of light or dark - which
is what lets the same control switch a density, a language or a layout.

Persisting is the host's problem on purpose. A cookie, a server function, an
account row and a `localStorage` key are four answers with four different
trade-offs, and a component that picked one would be wrong in three codebases
out of four.

> [!CAUTION] The attribute must already be on `<html>` before this mounts
> A toggle that applies the theme in an effect **guarantees** a flash: the
> server paints one theme, the effect corrects it, and everyone sees both. This
> only changes an attribute that was already correct in the first byte.

## Why a radiogroup

Three states, and a switch is a lie about two of them.

Arrow keys move between radios for free - the behaviour a group of related
choices should have, and the one a row of buttons has to be given by hand. That
is the whole reason to reach for the role rather than three buttons and a
`data-active`.

**Roving focus** comes with it: a radiogroup is one tab stop, so exactly one
option is focusable and the rest are `tabIndex={-1}`. Without it a three-option
switcher costs three tabs to walk past - three tabs spent on a decoration.

The selection wraps at the ends. A row that stops makes the reader guess
whether they have hit the end or whether the key is broken.

## `aria-checked` is the selector

```css
.theme-toggle-option[aria-checked="true"] { … }
```

The attribute that tells a screen reader which option is chosen is the same one
that draws it, so the two cannot disagree. A separate `data-active` beside it
is a second source of truth for one fact, and the way that fails is the worst
kind: the control looks right and announces the wrong option.

## `role="radio"` on a `<button>`

A real `<input type="radio">` is the semantic form, and it arrives with a
browser-drawn dot, a label association and a focus ring that would all have to
be undone to draw a segmented control. The button carrying the role is the
pattern assistive technology expects here, and the one the ARIA authoring guide
shows.

## Props

| Prop | Type | What it does |
| --- | --- | --- |
| `options` | `ThemeOption[]` | `{ id, label, icon }`. The label is the accessible name and the tooltip |
| `value` | `string` | The chosen id |
| `onChange` | `(id: string) => void` | Called with the id. Storing it is yours |
| `label` | `string` | Names the group. Default `"Theme"` |

## Where this is used

| Where | What |
| --- | --- |
| The nav, right-hand end | switching this site's theme |
| `theme.schemas.ts` | the cookie name, the values, the max-age |
| `theme.functions.ts` | reads the cookie on the server, so the first byte is right |
| `packages/atoms/theming.md` | why a cookie and not a media query |
