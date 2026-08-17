---
title: Get Started
summary: Wrap something in `ScrollSpin` and see it turn on scroll.
---

Install commands are on Home, attached from the registry. This tab starts after
the install worked.

## Use it

```tsx
import { ScrollSpin } from "@sushindustries/ui";

export function Hero() {
	return (
		<ScrollSpin revolutions={2} tilt={8}>
			<img src="/mark.svg" alt="" />
		</ScrollSpin>
	);
}
```

The component emits class names from `@sushindustries/atoms`, so import that
stylesheet once at your root:

```ts
import "@sushindustries/atoms/atoms.css";
```
