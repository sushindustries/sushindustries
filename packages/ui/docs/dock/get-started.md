---
title: Get Started
summary: Render Dock once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Clock, Dock } from "@sushindustries/ui";

export function Example() {
	return (
		<Dock
			tasks={[
				{ id: "a", label: "Components", active: true },
				{ id: "b", label: "Search", icon: "search" },
			]}
			onSearch={() => {}}
			onSelectTask={(id) => {}}
			onCloseTask={(id) => {}}
			trailing={<Clock />}
		/>
	);
}
```

## What you should see

A strip: a round search well on the left if `onSearch` is set, one button per
task in the middle, and whatever `trailing` is on the right. Pressing a task
button that is already active minimises it instead of doing nothing - that
toggle is the whole interaction this component offers.

## If nothing happens

`Dock` renders unconditionally as long as it is mounted - there is no prop
that hides it. If pressing a task or the search well does nothing, check that
`onSelectTask` / `onSearch` are actually wired to something: this component
only calls the callback with the task's `id`, it never decides what pressing
a task should do.
