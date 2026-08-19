---
title: Get Started
summary: Render Toast once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Button, ToastProvider, useToast } from "@sushindustries/ui";

function CopyCommandButton() {
	const { toast } = useToast();

	return (
		<Button onClick={() => toast("Copied the command")}>
			Copy the command
		</Button>
	);
}

export function Example() {
	return (
		<ToastProvider>
			<CopyCommandButton />
		</ToastProvider>
	);
}
```

## What you should see

Nothing, until the button fires. Then a small card appears in the bottom
right corner with the message, stays for four seconds, and disappears -
sliding in with a short animation, gone with none. Fire it twice quickly
and there are two cards stacked, each on its own four-second clock.

## If nothing happens

Calling `useToast()` anywhere that is not inside a `<ToastProvider>` throws
immediately, with a message naming exactly that - so a blank page and a
console error together mean the provider is missing above the component
that called the hook, not that the toast itself failed silently.
