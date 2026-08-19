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

## Where this is used

| Where | What |
| --- | --- |
| The nav, right-hand end | switching this site's theme |
| `theme.schemas.ts` | the cookie name, the values, the max-age |
| `theme.functions.ts` | reads the cookie on the server, so the first byte is right |
| `packages/atoms/theming.md` | why a cookie and not a media query |
