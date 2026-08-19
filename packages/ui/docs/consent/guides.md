---
title: Guides
summary: Using Consent well, and the mistakes that look like it is broken.
---

## Storing the answer

`Consent` reports a click and nothing else. A minimal host looks like this:

```tsx
const [status, setStatus] = useState<"pending" | "granted" | "denied">(
	() => (localStorage.getItem("consent") as typeof status) ?? "pending",
);

function record(next: "granted" | "denied") {
	localStorage.setItem("consent", next);
	setStatus(next);
}

<Consent open={status === "pending"} onAccept={() => record("granted")} onDecline={() => record("denied")}>
	...
</Consent>
```

Reading storage at initial state, rather than in an effect that flips `open`
after mount, is what stops the bar flashing open for a returning visitor
before the stored answer has been read.

## Composing it

It renders `position: fixed`, docked to a corner by the stylesheet, so it
does not need a positioned parent and can be mounted near the root of the
page. Nothing about it assumes a particular ancestor.

## When not to use it

Anywhere the law being satisfied requires blocking access until an answer is
given. This component is non-modal on purpose - no backdrop, no focus trap,
the page stays live - which is correct for "may I measure this" and wrong for
a gate the visitor cannot get past.
