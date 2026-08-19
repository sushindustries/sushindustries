---
title: Guides
summary: The rules that keep a remembered desk safe to render on a server, and what every call on the returned object does.
---

## Two rules make it safe to render on a server

**The first render is always the empty desk**, on the server and on the client
alike. Storage is read in an effect afterwards.

```ts
const [desk, setDesk] = useState<DeskState>(EMPTY_DESK);

useEffect(() => {
	try {
		const stored = window.localStorage.getItem(key);
		if (stored) setDesk({ ...EMPTY_DESK, ...JSON.parse(stored) });
	} catch {
		// A default desk is a working desk.
	}
	setReady(true);
}, [key]);
```

Reading `localStorage` during render produces markup the server could not have
sent. React answers a mismatch by discarding the tree and rebuilding it, and on
a page of icons the cost of that is every icon briefly having no working click
handler. That has already happened here once, from a `typeof document` branch.

**None of it is required.** Where a window sits is a preference about a
decoration. If storage is full, disabled, or in a browsing mode that refuses it,
the desk is simply the one everybody else gets - so every access is wrapped and
every failure is silent. There is nothing useful to tell somebody about it.

## One window per folder

Opening a folder that is already open raises it rather than stacking a second
identical window on the first. That is what people expect, and it is also what
stops an impatient double-click producing two windows.

## `toggle` is the taskbar's press

Minimised, it comes back and comes forward. Behind, it comes forward. Already in
front, it goes away.

```tsx
<Dock tasks={tasks} onSelectTask={desk.toggle} onCloseTask={desk.close} />
```

That last case is what makes a taskbar a taskbar rather than a list of links,
and it lives here rather than in the dock because it is a decision about state.
The dock presses; the desk decides.

A minimised window keeps its position, its size and its place in the stack. It
is a flag rather than a second list, because it is the same window with
somewhere else to be.

## `raise` does nothing when it can

Raising the front-most window returns the same state object, so React does not
re-render and the `z` counter does not climb forever on repeated clicks. A
counter that only goes up is fine until it is serialised into storage on every
press.

## The API

```ts
const desk = useDeskState("my.desk");

desk.open(["components", "motion"]);
desk.navigate(id, ["components"]);
desk.move(id, x, y);
desk.resize(id, w, h);
desk.raise(id);
desk.toggle(id);         // what a taskbar press does
desk.close(id);

desk.hide(entryId);      // take an icon off the desktop
desk.restore(entryId);
desk.reset();            // put everything back
```

`ready` turns true once storage has been read. Rendered output must not depend
on it - it exists so a consumer can avoid animating a restored window into
place.
