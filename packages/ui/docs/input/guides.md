---
title: Guides
summary: Using Input well, and the mistakes that look like it is broken.
---

The Guides tab is for the things that are true after it works. If it belongs in
"how do I install this", it goes in Get Started; if it is a prop table, it goes
in API.

## Composing it

`Input` is the control and nothing else - no label, no hint, no error state.
Pair it with `Field` for those:

```tsx
import { Field, Input } from "@sushindustries/ui";

<Field label="Email" hint="I'll only use this to reply">
	<Input type="email" name="email" />
</Field>;
```

`Field` nests the control inside a `<label>`, so the association needs no
`id` to survive a refactor, and it wires `aria-describedby` to the hint or
error text automatically. Passing `error` to `Field` is what turns on the red
border - `Input` itself has no invalid state of its own to set.

## When not to use it

For anything that is not a single line of text - a multi-line field is
`Textarea`, a fixed set of choices is a select or a radio group. `Input`
passes through the full native attribute surface, so `type="number"` or
`type="date"` both work, but the moment the value needs formatting or
parsing beyond what the browser's own input types do, that logic belongs in
the consumer, not in this component.
