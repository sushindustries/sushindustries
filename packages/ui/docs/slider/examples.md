---
title: Examples
summary: Slider in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="slider" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { Slider, Switch } from "@sushindustries/ui";

export function PlaybackSettings() {
	const [volume, setVolume] = useState(70);

	return (
		<form className="flex flex-col gap-4">
			<Slider
				label="Volume"
				min={0}
				max={100}
				value={volume}
				onChange={(event) => setVolume(Number(event.target.value))}
			/>
			<Switch label="Smooth scrolling" defaultChecked />
		</form>
	);
}
```

## What this example is not

`onChange` here reads `event.target.value` as a string and converts it -
that conversion is the caller's job for every native range input, not
something `Slider` does for you.
