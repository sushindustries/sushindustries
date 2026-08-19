---
title: Toast
summary: Strings, four seconds, bottom corner, announced politely - one provider and one hook, nothing else.
updated:
---

A minimal toast system: call `useToast().toast(message)` from anywhere under
`ToastProvider` and a string appears bottom-right for four seconds, announced
via `role="status"`. Reach for it for a plain confirmation or error message -
not for anything with an action button, a promise, or a reason to stay on
screen longer.

<!-- ::start:showcase demo="toast" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Toasts are kept deliberately small: strings, four seconds, one bottom corner.
The region is `role="status"` so an arrival gets announced politely instead of
interrupting whatever's being read. The whole system is one provider and one
hook on purpose - actions, promises and progress bars belong to the page that
owns that state, not to a passing notification.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
