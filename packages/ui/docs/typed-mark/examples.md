---
title: Examples
summary: Typed Mark in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="typed-mark" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

The site's assistant panel hands its mark straight to a `mark` prop, so the
name types itself in every new conversation:

```tsx
import { AssistantPanel, TypedMark } from "@sushindustries/ui";

export function Assistant() {
	return (
		<AssistantPanel
			mark={<TypedMark text="sushi industries" />}
			messages={messages}
			onSend={ask}
			placeholder="Ask about this site"
		/>
	);
}
```

## What this example is not

`AssistantPanel` treats `mark` as an opaque `ReactNode` - it does not know
this is a `TypedMark` and would render any other node just as happily. The
pairing here is a choice made at the call site, not a contract between the
two components.
