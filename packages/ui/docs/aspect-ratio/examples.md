---
title: Examples
summary: Aspect Ratio in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="aspect-ratio" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { AspectRatio, Card } from "@sushindustries/ui";

export function VideoCard({ src, poster }: { src: string; poster: string }) {
	return (
		<Card title="Product walkthrough">
			<AspectRatio ratio={16 / 9}>
				<video src={src} poster={poster} controls />
			</AspectRatio>
		</Card>
	);
}
```

## What this example is not

`ratio={16 / 9}` here is fixed at build time, but nothing about the
component requires that - it reads just as well from a prop passed down
from a CMS field, as long as the value is a number by the time it
reaches `AspectRatio`.
