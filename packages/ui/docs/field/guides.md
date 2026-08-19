---
title: Guides
summary: Using Field well, and the mistakes that look like it is broken.
---

## The error replaces the hint, it does not join it

```tsx
<Field label="Handle" hint="Letters and numbers only." error={errors.handle}>
	<Input value={handle} onChange={onChange} />
</Field>
```

`error ?? hint` is the whole rule: whichever one is present is what shows,
never both, and a present `error` always wins. That is deliberate - a hint
explaining the rule and an error saying the rule was broken are the same
sentence said twice once something has actually gone wrong.

## Why the error is not just red text

`aria-describedby` points the control at the note - hint or error - so a
screen reader announces it as part of describing the control, not as
separate text that happens to sit nearby. `data-invalid` on the `<label>`
carries the colour. Removing the colour and keeping the wiring would still
work for someone using assistive tech; removing the wiring and keeping the
colour would not.
