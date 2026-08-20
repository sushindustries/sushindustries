---
title: Guides
summary: Using Secret Reveal well, and the mistakes that look like it is broken.
---

## Composing it

It does not confirm that the secret was stored, and it does not dismiss itself.
Whether there is a "Done" button, and what pressing it costs, belongs to the
page - so it takes `children` and puts them in the action row beside the copy
button.

```tsx
<SecretReveal value={token} label="Copy the token">
	<Button variant="ghost" onClick={dismiss}>
		I have stored it
	</Button>
</SecretReveal>
```

## When not to use it

**Do not reach for it to mask a value behind a reveal toggle.** A masked secret
with a show button is a pattern from password fields, where the point is
shoulder surfing on a value the user already knows. This is for a value the
user is seeing for the first and only time, and hiding it adds a click before
the one thing they came to do.

**Do not use it for a snippet that merely contains a credential.** A
registration command with a truncated prefix in it is an illustration, and a
copy button on an illustration hands somebody a command that does not work.
Pass `copy={false}`:

```tsx
<SecretReveal
	copy={false}
	value={`claude mcp add --transport http example \\\n  --header "Authorization: Bearer ${prefix}…"`}
/>
```

## If the copy button never confirms

It needs a secure context. `navigator.clipboard` does not exist over plain
`http`, so on a laptop the button will look like it did nothing - which is also
the truthful rendering of what happened.

That is the reason the value carries `user-select: all`: one click selects the
whole thing, and selecting by hand is the path that works everywhere. If you
are testing copy behaviour, test it over `https` or on `localhost`, which
browsers treat as secure.
