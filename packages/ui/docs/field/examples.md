---
title: Examples
summary: Field in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="field" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { Button, Field, Input } from "@sushindustries/ui";

export function NewsletterForm() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string>();

	return (
		<form
			className="flex col gap-4"
			onSubmit={(e) => {
				e.preventDefault();
				if (!email.includes("@")) {
					setError("That does not look like an email.");
					return;
				}
				setError(undefined);
			}}
		>
			<Field label="Email" hint="Once a month, at most." error={error}>
				<Input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
			</Field>
			<Button type="submit">Subscribe</Button>
		</form>
	);
}
```

## What this example is not

Not the validation. `Field` only ever displays whatever string it is handed
as `error` - deciding when that string exists, and what it says, is the
form's job entirely.
