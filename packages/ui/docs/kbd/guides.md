---
title: Guides
summary: Using Kbd well, and the mistakes that look like it is broken.
---

The Guides tab is for the things that are true after it works. If it belongs in
"how do I install this", it goes in Get Started; if it is a prop table, it goes
in API.

## One key per Kbd

A shortcut with more than one key - `⌘K`, `Ctrl+Shift+P` - is more than one
`<Kbd>`, joined by plain text or a `+`, not one `<Kbd>` with both characters
inside it:

```tsx
<Kbd>⌘</Kbd>+<Kbd>K</Kbd>
```

That is what the command palette itself does for its own shortcuts. A single
`<kbd>` wrapping "⌘K" would still render, but it reads as one press rather
than a chord, and the chip shape was drawn for a single key.
