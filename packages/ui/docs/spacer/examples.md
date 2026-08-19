---
title: Examples
summary: Spacer in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="spacer" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Spacer } from "@sushindustries/ui";

export function Article({ intro, body }: { intro: string; body: string }) {
	return (
		<article className="prose">
			<p>{intro}</p>
			<Spacer size={6} label="Later" />
			<p>{body}</p>
		</article>
	);
}
```

## What this example is not

This is the JSX form, for the rare case of composing `Spacer` directly
inside a hand-written page. Its home is Markdown - the
`<!-- ::start:spacer size="6" label="Later" --><!-- ::end:spacer -->` block
this site's own posts and docs pages use - because that is where there is
no markup left to hang a margin on.
