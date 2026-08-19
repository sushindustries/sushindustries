---
title: Examples
summary: Code Block in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="code-block" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { CodeBlock } from "@sushindustries/ui";

export function InstallStep({ command }: { command: string }) {
	return (
		<section className="flex col gap-2">
			<p className="fg-dim m-0 text-sm">Then install it:</p>
			<CodeBlock code={command} language="bash" />
		</section>
	);
}
```

## What this example is not

Not proof that highlighting is free. It is synchronous and runs during SSR,
which is why a whole page of these costs nothing on hydration - but a page
that renders hundreds of blocks at once is still doing hundreds of synchronous
highlight passes on the server, on every request.
