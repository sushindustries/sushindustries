---
title: Examples
summary: Boot Loader in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="boot-loader" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { BootLoader } from "@sushindustries/ui";
import { ProductViewer } from "@sushindustries/react-product-viewer";

export function ModelSection() {
	const [loaded, setLoaded] = useState(false);

	return (
		<div className="device-screen">
			<ProductViewer src="/models/logo.glb" onLoad={() => setLoaded(true)} />
			<BootLoader ready={loaded} label="Loading model" />
		</div>
	);
}
```

## What this example is not

`BootLoader` renders on top of `ProductViewer` here, not instead of it -
both mount immediately, and the loader simply covers the canvas until
`ready` is true and then removes itself. It is not a suspense boundary or
a data fetcher; the host still owns deciding when `ready` should flip.
