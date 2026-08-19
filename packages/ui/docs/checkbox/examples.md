---
title: Examples
summary: Checkbox in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="checkbox" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { Button, Checkbox } from "@sushindustries/ui";

export function TermsForm() {
	const [agreed, setAgreed] = useState(false);

	return (
		<form className="flex col gap-4">
			<Checkbox
				label="I agree to the terms"
				checked={agreed}
				onChange={(event) => setAgreed(event.target.checked)}
			/>
			<Button type="submit" disabled={!agreed}>
				Continue
			</Button>
		</form>
	);
}
```

## What this example is not

The checkbox here is controlled - `checked` and `onChange` are both set,
which is what lets `Button`'s `disabled` state react to it. An
uncontrolled checkbox (no `checked` prop, just `defaultChecked`) works
fine on its own, but nothing else on the page can read its value without
also reaching for a ref.
