---
title: Get Started
summary: Render Section once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Section } from "@sushindustries/ui";

export function AboutSection() {
	return (
		<Section id="about" label="About" title="What this is">
			<p>One person builds this. The site is the library's first consumer.</p>
		</Section>
	);
}
```

## What you should see

A centred container with a small monospace kicker ("About"), an `h2` ("What
this is") under it, and the body below that - the heading fades and rises in
first, the body follows about 80ms later, once the section reaches the
viewport. On the very first render, before that observer fires, both are
present in the markup but invisible.

## If nothing happens

If the section stays invisible for good, check that it isn't sitting inside a
parent with `overflow: hidden` and no real height - that stops the `Reveal`s
inside it from ever reporting as intersecting. If it appears instantly with
no motion, `prefers-reduced-motion` is set, and that's correct.
