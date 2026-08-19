---
title: Model Mark
summary: A model at icon size - turning, uninteractive, and layered over a real icon that never gets removed.
---

```tsx
import { ModelMark } from "@sushindustries/react-product-viewer/model-mark";

<ModelMark
	model={{ url: logoUrl, realLength: 1 }}
	glyph={<Icon name="sushi" size={30} />}
	label="Sushindustries"
	seconds={18}
/>;
```

## Why this is an element and not four props

`ModelViewer` is right for a hero and wrong for a 48px square in four separate
ways. Each of them looks like a *different* bug, and none of them is a fault in
the viewer - every one is correct for a product on a card, which is what it was
built for.

| What | Why it is wrong here | What it looks like |
| --- | --- | --- |
| Orbit controls | The canvas takes the pointerdown, so a button around it never receives the click | An icon that spins and refuses to open |
| Contact shadow | A second render target, re-baked every frame while the model turns | Nothing. It just costs |
| Fixed camera | `fov` is *vertical*, so a square canvas has a far narrower horizontal field of view than the landscape one the camera was placed for | "The model is blurry", or "it is not rendering" |
| Progress scrim | An overlay and a 4px backdrop blur | A grey square that appears and vanishes |

Four props somebody has to remember every time is a rule. An element is a
decision that has already been made.

> [!CAUTION] `fov` is vertical, and that is the whole trap
> A camera tuned on a wide canvas looks completely correct until the same
> component is put in a square one. The model does not move; the frame closes in
> on it.
