---
title: Get Started
summary: Render Questions once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Questions } from "@sushindustries/ui";

export function Help() {
	return (
		<Questions
			heading="Common questions"
			questions={[
				"How do I install a component?",
				"Do I need the whole library?",
			]}
		/>
	);
}
```

## What you should see

A heading followed by a list of the questions, each rendered as plain text -
this example has no `onAsk`, so nothing is clickable. Pass `onAsk` and the
same questions become buttons.

## If nothing happens

An empty `questions` array renders nothing at all, heading included - that's
deliberate, not a bug. If the heading shows but the list doesn't look like
buttons, check whether `onAsk` is actually being passed; without it the items
are `<span>`s by design.
