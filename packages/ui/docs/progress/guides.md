---
title: Guides
summary: Using Progress well, and the mistakes that look like it is broken.
---

## Composing it

`Progress` renders its own `<label className="field">` - don't wrap it in
another one. Nesting labels is invalid HTML, and the browser resolves a click
on the outer label to whichever form control it finds first, not necessarily
this one.

## When not to use it

For a percentage-like number with no real completion signal - a bar that
fills on a timer just to look busy is worse than the indeterminate sweep,
which tells the truth about what's known. Reach for `value` only when there's
a real fraction behind it.
