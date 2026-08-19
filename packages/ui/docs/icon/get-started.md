---
title: Get Started
summary: Render Icon once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Icon } from "@sushindustries/ui";

export function Example() {
	return <Icon name="star" size={24} />;
}
```

## What you should see

A 24px outline star, drawn in the surrounding text color - no fill, no
background, `1.5` stroke weight. Change the parent's `color` and the glyph
follows, because the SVG's stroke is `currentColor`.

## If nothing happens

`name` is typed against the generated `IconName` union, so a name that is not
in the set fails to compile - it never renders an empty box. A glyph that
compiles but does not appear is almost always sized to nothing: check `size`
was not left at `0`, and that the parent is not clipping overflow at a size
smaller than the icon.
