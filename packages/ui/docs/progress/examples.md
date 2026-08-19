---
title: Examples
summary: Progress in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="progress" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Progress } from "@sushindustries/ui";

export function UploadCard({ percent }: { percent: number | undefined }) {
	return (
		<div className="card p-6">
			<h3 className="h4 m-0">report.pdf</h3>
			<div className="mt-4">
				<Progress label="Uploading" value={percent} />
			</div>
		</div>
	);
}
```
