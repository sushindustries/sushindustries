---
title: Examples
summary: Textarea in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="textarea" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Field, Textarea } from "@sushindustries/ui";
import { useState } from "react";

export function FeedbackForm() {
	const [message, setMessage] = useState("");

	return (
		<form className="flex flex-col gap-4">
			<Field label="What happened" hint="As much detail as you can give">
				<Textarea
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					placeholder="Say what happened, in order."
				/>
			</Field>
			<button type="submit" className="btn">
				Send
			</button>
		</form>
	);
}
```

## What this example is not

There is no character counter or max-length handling here - `maxLength` is
a native attribute `Textarea` passes through untouched, but showing the
count as someone types is markup the caller adds, not something this
component renders for you.
