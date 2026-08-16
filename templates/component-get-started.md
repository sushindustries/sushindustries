<!-- template
target: packages/ui/docs/{slug}/get-started.md
tokens: slug, title
-->
---
title: Get Started
summary: Install it, render it once, and know what you should be looking at.
---

## Install

<!-- ::start:tabs -->

### TanStack

```shell
tanstack add https://sushindustries.com/r/tanstack/{slug}.json
```

### shadcn

```shell
pnpm dlx shadcn@latest add https://sushindustries.com/r/shadcn/{slug}.json
```

### pnpm

```shell
pnpm add @sushindustries/ui @sushindustries/atoms
```

<!-- ::end:tabs -->

## Use it

```tsx
import { Something } from "@sushindustries/ui";

export function Example() {
	return <Something />;
}
```

## What you should see

Describe the result, so somebody can tell a working install from a silent one.
A component that renders nothing when it is correct needs this paragraph more
than any other component does.

## If nothing happens

The two or three things that are actually wrong when it does not work: the
tokens are not imported, the parent has no height, a prop defaults to off.
