---
title: Get Started
summary: Render Clock once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Clock } from "@sushindustries/ui";

export function Example() {
	return <Clock />;
}
```

## What you should see

`--:--` for the first render, then your own weekday and time, in your own
zone - short weekday, hour, minute. It updates every fifteen seconds, not
every second: a clock showing minutes has no reason to re-render sixty times
a minute.

## If nothing happens

The placeholder on first paint is correct, not a bug - it is what both the
server and the first client frame render, on purpose. If the real time never
arrives, the component itself never mounted in the browser: check it is not
stuck inside something that never hydrates. The time value itself cannot be
wrong, since it comes straight from `Intl.DateTimeFormat` with no locale or
zone passed - whatever the browser already knows.
