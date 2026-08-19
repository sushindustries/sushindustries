---
title: Examples
summary: Questions in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="questions" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Questions } from "@sushindustries/ui";
import { useAssistant } from "../hooks/use-assistant";

export function DocsFooter() {
	const { ask } = useAssistant();

	return (
		<footer className="container mt-12">
			<Questions
				heading="Try asking"
				questions={[
					"What does renderLink do?",
					"How do I add a package to the registry?",
				]}
				onAsk={ask}
			/>
		</footer>
	);
}
```

## What this example is not

Wired to a real assistant. `useAssistant` here stands in for whatever puts a
question in front of one - this component only calls `onAsk`, it never
answers anything itself.
