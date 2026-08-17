---
title: Get Started
summary: Install `ScrollSpin`, wrap something in it, and see it turn on scroll.
---

## Install

<!-- ::start:tabs -->

### TanStack

```shell
tanstack add https://sushindustries.com/r/tanstack/scroll-spin.json
```

### shadcn

```shell
pnpm dlx shadcn@latest add https://sushindustries.com/r/shadcn/scroll-spin.json
```

### pnpm

```shell
pnpm add @sushindustries/ui @sushindustries/atoms
```

<!-- ::end:tabs -->

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
