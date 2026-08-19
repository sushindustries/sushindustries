---
title: Get Started
summary: Render Typed Mark once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { TypedMark } from "@sushindustries/ui";

export function Example() {
	return <TypedMark text="sushi industries" />;
}
```

## What you should see

The words appear one character at a time, roughly 55ms apart, each one
landing in the next colour of the CLI palette. There is no flash of the whole
word first - the markup is final on arrival, and it is the CSS animation
delay alone that staggers the reveal. Reload with JavaScript disabled and the
word is simply there, in full colour, all at once.

## If nothing happens

If every character appears at once in the same colour instead of staggered
and cycling, the atoms stylesheet is not loaded - this mark has no fallback
styling of its own, it depends entirely on `.typed` and `.typed-char` from
`packages/atoms`.
