---
title: Guides
summary: Using Clock well, and the mistakes that look like it is broken.
---

## Choosing the format

`options` is passed straight to `Intl.DateTimeFormat`, so anything that
constructor accepts works here, not just the weekday-and-time default.

```tsx
<Clock
	options={{
		weekday: "long",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}}
	every={1000}
/>
```

Pair a finer `options` with a finer `every`: a clock with seconds in it
should not sit for up to fifteen seconds before it agrees with the wall
clock, and a clock without seconds has no reason to poll every one.

## Why it never renders on the server

The server has its own clock and zone. Rendering a real time there means the
markup says one thing and the first client render says another - a hydration
mismatch, and React discards the whole tree to fix it. `Clock` renders the
placeholder on both sides and fills in the real value from an effect
afterward, which is also why there is no `suppressHydrationWarning` here:
there is nothing to suppress.

## When not to use it

A clock that has to agree with a server-known value - a countdown to a
deadline, a "posted 3 minutes ago" - is not this component. `Clock` only ever
reads the reader's own device; wire that case up separately.
