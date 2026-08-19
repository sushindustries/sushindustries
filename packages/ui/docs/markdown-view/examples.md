---
title: Examples
summary: Markdown View in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="markdown-view" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { MarkdownView, type MarkdownBlocks, type ReferenceMap } from "@sushindustries/ui";
import { Showcase } from "./showcase";

const blocks: MarkdownBlocks = {
	showcase: ({ attributes }) => (
		<Showcase demo={attributes.demo} height={Number(attributes.height ?? 420)} />
	),
};

const references: ReferenceMap = {
	Showcase: {
		title: "Showcase",
		href: "/packages/ui/docs/showcase",
		summary: "Renders a component at three widths, with its source.",
	},
};

export function Post({ source }: { source: string }) {
	return <MarkdownView source={source} blocks={blocks} references={references} />;
}
```

## What this example is not

`attributes.height` arrives as the string `"420"`, so the block converts it
with `Number()` before handing it to `Showcase` - `MarkdownView` never parses
attribute values for you.
