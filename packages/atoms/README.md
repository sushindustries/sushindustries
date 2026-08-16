# @sushindustries/atoms

Design tokens and the atomic utilities built on them. One stylesheet, no build
step, no framework, no class-name generator.

## Install

```bash
pnpm add @sushindustries/atoms
```

## Use

Import it once, at the root of the app:

```ts
import "@sushindustries/atoms/atoms.css";
```

Then compose. Every class does exactly one thing:

```tsx
<article className="card">
	<h3 className="h3 m-0">Title</h3>
	<p className="m-0 fg-dim text-sm">Body copy.</p>
</article>
```

## Why not Tailwind

Tailwind is the right answer when a team needs every utility and a build step
is already paid for. This is one stylesheet of about 300 lines, served as-is
and cached forever. Nothing scans your source, nothing purges, and reading the
file tells you the whole system.

The trade is real: there is no arbitrary value syntax. If a value is not in the
scale, you either add it to the scale or you use the scale. That is the point -
a short scale is what makes an interface look measured rather than assembled.

## Tokens

Colour is nori (green-black) ground, rice (warm off-white) text, one salmon
accent. Spacing is a 9-step scale, type is a clamped scale so one set of
headings covers phone through desktop.

Override any of them by redefining the custom property on `:root` after the
import.
