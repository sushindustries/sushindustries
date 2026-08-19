---
title: Examples
summary: Accordion in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="accordion" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Accordion } from "@sushindustries/ui";
import { faqItems } from "./faq.catalogue";

export function FaqSection() {
	return (
		<section className="container section">
			<h2>Questions</h2>
			<Accordion items={faqItems} />
		</section>
	);
}
```

## What this example is not

`faqItems` is built-time content in this example, but `Accordion` has no
opinion about where `items` comes from - a search result, a CMS response,
a hand-written array all work the same way, as long as each entry has a
stable `id`.
