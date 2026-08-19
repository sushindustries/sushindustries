---
title: Nav Bar
summary: A site header whose panels expand, built on <details> so it works before hydration.
---

The header at the top of this page is this component. It is fed by a Markdown
file, and nothing about which site it is in is written in the component.

<!-- ::start:showcase demo="nav-bar" height="420" -->
<!-- ::end:showcase -->

## Why `<details>` and not state

A nav is the first thing a reader touches, and often they touch it before
hydration has finished. A menu driven by `useState` is inert until then: it
looks interactive, and the first tap does nothing.

`<details>` opens on click and on Enter, is announced to a screen reader as
expandable, and closes on Escape. All of that is the browser's, so it works on
the server's first paint.

```tsx
function closeOnLeave(event: React.FocusEvent<HTMLDetailsElement>): void {
	if (event.currentTarget.contains(event.relatedTarget)) return;
	event.currentTarget.removeAttribute("open");
}

<details className="nav-menu" onBlur={closeOnLeave}>
	<summary className="nav-link">Components</summary>
</details>;
```

What it does not have is close-on-outside-click. That comes back as one `onBlur`
handler that removes the `open` attribute when focus leaves the group. If that
handler never runs, the menu stays open until you press the trigger again, which
is mildly annoying rather than broken. That is the trade: the failure mode of
the JavaScript half is an inconvenience, not a dead control.
