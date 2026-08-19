---
title: Examples
summary: Copy Button in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="copy-button" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { CopyButton } from "@sushindustries/ui";

export function ApiKeyRow({ value }: { value: string }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<code className="mono text-sm">{value.slice(0, 8)}…</code>
			<CopyButton text={value} label="Copy key" ground="paper" />
		</div>
	);
}
```

## What this example is not

Not a masked-value component. The truncated display is for reading; the full
`value` still goes to the clipboard on click, which is the point - do not
reuse this pattern somewhere the truncated text is the only thing that should
ever leave the row.
