---
title: Get Started
---

## Install

<!-- ::start:tabs -->

### TanStack

```shell
tanstack add https://sushindustries.com/r/tanstack/product-viewer.json
```

### pnpm

```shell
pnpm add @sushindustries/react-product-viewer three @react-three/fiber @react-three/drei three-stdlib
```

<!-- ::end:tabs -->

## Mount it lazily

```tsx
import { lazy, Suspense } from "react";

const ProductViewer = lazy(
	() => import("@sushindustries/react-product-viewer"),
);

export function Page() {
	return (
		<Suspense fallback={null}>
			<ProductViewer model={{ url: "/models/logo.glb", realLength: 1 }} />
		</Suspense>
	);
}
```

> [!CAUTION] Never import it statically
> `ProductViewer` is exported as a default specifically so `React.lazy` can
> take it. A static import pulls ~600 kB of three and R3F into your entry
> chunk, on every page, for every visitor — including the ones who never scroll
> to it.
