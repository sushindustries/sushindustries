---
title: Get Started
summary: One import gets every transition, animation and perspective rule on this site - there is nothing to configure.
---

## Install

```shell
pnpm add @sushindustries/atoms
```

There is no registry entry for this - it is not a component, so there is no
TanStack or shadcn command and nothing to add beyond the package itself.

## Use it

```ts
import "@sushindustries/atoms/atoms.css";
```

Once, at the app root. Every motion rule described on this page - the
easing token, the reveal-on-scroll fade, the perspective stage, the glass
blur - arrives with that one import. Nothing here is opt-in per component.

```tsx
<div data-reveal="out">
	<p>Fades and rises into place as it enters the viewport.</p>
</div>
```

## What you should see

An element with `data-reveal="out"` starts invisible and shifted 18px down.
Flip the attribute to `"in"` - which `Reveal` and `Section` do automatically
on scroll - and it fades and rises over 700ms with `--ease-out`. Under
`prefers-reduced-motion: reduce` it appears immediately in its final
position instead; nothing here holds it hidden.

## If nothing happens

An element stuck at `data-reveal="out"` forever, invisible, means nothing is
flipping the attribute to `"in"` - `data-reveal` is inert CSS, and the
transition only exists once something sets the attribute. Reach for `Reveal`
or `Section` from `packages/ui` rather than writing the attribute by hand,
unless the intersection logic is genuinely something else's job.
