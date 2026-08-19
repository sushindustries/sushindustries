---
title: Guides
summary: Using Native Select well, and the mistakes that look like it is broken.
---

## Composing it

It renders a `<span className="select-wrap">` around the real `<select>`, so
treat it the way you'd treat an `<input>`: inside a `<label>`, a `.field`
wrapper, or a form grid cell. It needs no container with a fixed height - the
field sizes to its content like any inline control.

## When not to use it

When an option needs more than text - an icon, a description, a price next to
a label - because the OS renders the popup and only reads the option's text.
Same for anything needing multiple selections or an in-page search: a native
`<select>` cannot do either, and there is no listbox in this library built to
replace it.
