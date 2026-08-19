---
title: Guides
summary: Using Radio Group well, and the mistakes that look like it is broken.
---

## Composing it

It renders a `<fieldset>` with its own `<legend>` - don't wrap it in another
label or fieldset for the group name, that duplicates the announcement
screen readers already get for free.

## When not to use it

For more than five or six options, where a `NativeSelect` reads faster and
takes less vertical space, or when more than one option can be true at
once - that's `Checkbox`, not a radio no matter how it's styled.
