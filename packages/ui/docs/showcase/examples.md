---
title: Examples
summary: Showcase in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="showcase" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

This is the shape every component page on this site uses under its own
`::start:showcase` block - `src` is a per-component preview route, `code` is
the string shown on the Code tab, and `renderCode` / `renderStackblitz` are
supplied once by the app rather than by every call site.

```tsx
import { Showcase } from "@sushindustries/ui";
import { highlight } from "~/modules/code/highlight";

export function ComponentPreview({ slug, source }: { slug: string; source: string }) {
	return (
		<Showcase
			src={`/preview/${slug}`}
			title={slug}
			code={source}
			renderCode={(code, language) => highlight(code, language)}
			height={380}
		/>
	);
}
```

## What this example is not

`renderCode` and `renderStackblitz` are render props for a reason: this
package ships no syntax highlighter and no StackBlitz SDK. A host that skips
`renderCode` still gets a working Code tab - the fallback is a plain `<pre>`
- and skipping `renderStackblitz` just drops that tab rather than breaking
anything.
