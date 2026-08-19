---
title: Examples
summary: useScrollTurn in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="use-scroll-turn" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

The home page's hero mark turns a three.js group's rotation directly,
rather than a CSS transform - the same measurement `ScrollSpin` uses, aimed
at a different write target:

```tsx
import { useCallback, useRef } from "react";
import { useScrollTurn } from "@sushindustries/ui";
import type { Group } from "three";

export function LogoModel() {
	const modelRef = useRef<Group>(null);

	const turn = useCallback(({ turn, wobble }: { turn: number; wobble: number }) => {
		const group = modelRef.current;
		if (!group) return;
		group.rotation.y = turn * Math.PI * 2;
		group.rotation.x = (wobble * Math.PI) / 180;
	}, []);

	useScrollTurn(turn, { revolutions: 3, tilt: 6 });

	return <ProductViewer model={LOGO_MODEL} modelRef={modelRef} transparent />;
}
```

A CSS `rotateY` on the canvas would spin the rendered image like a
photograph rather than turning the model inside it - which is why this
writes into the scene instead of onto the DOM node, unlike `ScrollSpin`.

## What this example is not

`ProductViewer` and `modelRef` are doing the three.js setup here; this hook
supplies only the `turn` and `wobble` numbers each frame. It has no opinion
about scenes, cameras or renderers.
