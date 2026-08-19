---
title: Examples
summary: Input in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="input" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Field, Input } from "@sushindustries/ui";
import { useState } from "react";

export function ContactForm() {
	const [email, setEmail] = useState("");
	const invalid = email.length > 0 && !email.includes("@");

	return (
		<form className="flex flex-col gap-4">
			<Field
				label="Email"
				error={invalid ? "That doesn't look like an email" : undefined}
			>
				<Input
					type="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
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

The validation here is a placeholder check, not a real one - a form that
matters would validate on submit and on blur, not on every keystroke, so the
error does not appear while somebody is still mid-word typing their address.
