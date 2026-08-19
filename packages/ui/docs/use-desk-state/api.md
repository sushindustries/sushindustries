---
title: useDeskState API
summary: What it takes, what it gives back, and what it does between.
---

<!-- generated:api -->

## Signature

```ts
useDeskState(key: string): DeskApi
```

The desk: which windows are open, where they are, and what has been put away. Two rules keep this safe to render on a server. **The first render is always the empty desk**, on the server and on the client alike, and storage is read in an effect afterwards. Reading localStorage during render produces markup the server could not have sent, and React answers a mismatch by discarding the tree and rebuilding it - which on a page of icons means every icon briefly has no working click handler. That failure has already happened here once. **None of it is required.** Where a window sits is a preference about a decoration. If storage is full, disabled, or in a browsing mode that refuses it, the desk is simply the one everybody else gets, so every access is wrapped and every failure is silent. There is nothing useful to say to somebody about it. Paths are stored as ids rather than as entries, because the stored desk outlives the tree it described: components get added and renamed, and a window pointing at a folder that no longer exists should quietly not reopen rather than restore a window onto nothing.

<!-- /generated:api -->

## Notes

`key` is the `localStorage` key, and it is also the identity boundary: two
`useDeskState` calls with the same key share one stored desk, which is how
`FolderShelf` and a dock built above it can agree about what is open without
being the same component. Two calls with different keys are two unrelated
desks that happen to render on the same page.

`raise` returns the same state object rather than a new one when the target
is already front-most, so calling it on every click of an already-focused
window does not re-render anything and does not push the `z` counter any
higher. Everything else always produces a new object, even when the change
is a no-op, because there was nothing cheap to check.

