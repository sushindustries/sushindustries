---
title: Examples
summary: Radio Group in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="radio-group" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { RadioGroup } from "@sushindustries/ui";
import { useState } from "react";

export function CheckoutForm() {
	const [speed, setSpeed] = useState("standard");

	return (
		<form className="flex flex-col gap-6">
			<RadioGroup
				label="Shipping speed"
				options={[
					{ value: "standard", label: "Standard - 3 to 5 days" },
					{ value: "express", label: "Express - next day" },
				]}
				value={speed}
				onChange={setSpeed}
			/>
		</form>
	);
}
```
