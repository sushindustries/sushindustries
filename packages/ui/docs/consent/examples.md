---
title: Examples
summary: Consent in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="consent" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { Consent } from "@sushindustries/ui";
import { startAnalytics } from "./analytics";

export function RootLayout({ children }: { children: React.ReactNode }) {
	const [status, setStatus] = useState<"pending" | "granted" | "denied">(
		"pending",
	);

	return (
		<>
			{children}
			<Consent
				open={status === "pending"}
				onAccept={() => {
					setStatus("granted");
					startAnalytics();
				}}
				onDecline={() => setStatus("denied")}
			>
				I measure page views to see what is worth writing more of. Nothing
				personal, nothing sold.
			</Consent>
		</>
	);
}
```

## What this example is not

Not a working consent system on its own. It has no storage, so a real
`startAnalytics` call would still need to run this same check on every load -
read the stored answer first, and only render `Consent` at all when none
exists yet.
