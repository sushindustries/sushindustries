---
title: Guides
summary: Why Theme Toggle is a radiogroup, how the checked state draws itself, and the props it takes.
---

## Why a radiogroup

Three states, and a switch is a lie about two of them.

```tsx
<div
	className="theme-toggle"
	role="radiogroup"
	aria-label={label}
	onKeyDown={onKeyDown}
>
	{options.map((option) => (
		<button
			key={option.id}
			type="button"
			role="radio"
			aria-checked={option.id === value}
			aria-label={option.label}
			tabIndex={option.id === value ? 0 : -1}
			onClick={() => onChange(option.id)}
		>
			<Icon name={option.icon} size={15} />
		</button>
	))}
</div>
```

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
