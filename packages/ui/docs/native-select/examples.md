---
title: Examples
summary: Native Select in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="native-select" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { NativeSelect } from "@sushindustries/ui";

export function ShippingForm() {
	return (
		<form className="flex flex-col gap-4">
			<label className="field">
				<span className="label">Country</span>
				<NativeSelect name="country" required defaultValue="">
					<option value="" disabled>
						Choose one
					</option>
					<option value="pl">Poland</option>
					<option value="de">Germany</option>
				</NativeSelect>
			</label>
			<label className="field">
				<span className="label">Size</span>
				<NativeSelect name="size" defaultValue="m">
					<option value="s">S</option>
					<option value="m">M</option>
					<option value="l">L</option>
				</NativeSelect>
			</label>
		</form>
	);
}
```
