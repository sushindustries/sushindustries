---
title: Guides
summary: Using Doc Nav well, and the mistakes that look like it is broken.
---

## Composing it

```tsx
renderLink={({ id, className, children, ...rest }) => (
	<Link to="/components/$slug" params={{ slug: id }} className={className} {...rest}>
		{children}
	</Link>
)}
```

`id` arrives beside the resolved `href` because a typed router needs the route
pattern and its params, not a finished path. `aria-current` rides in `rest`
for the open item, since this component cannot set an attribute on an element
it did not create. The row itself carries `data-active`, so the colour is
right even when a host drops what it is handed.
