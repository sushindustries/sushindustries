---
title: Guides
summary: Using Copy Button well, and the mistakes that look like it is broken.
---

## Choosing a ground

```tsx
<CopyButton text={code} ground="slab" />   {/* the charcoal of a code block */}
<CopyButton text={command} ground="paper" />  {/* everywhere else */}
<CopyButton text={value} ground="accent" />
```

The chip is glass either way - fill plus edge, no blur - but one glass recipe
does not read correctly on every background, so `ground` picks which recipe.
Get it wrong and the button is still clickable, just faint or oddly bright
against whatever it sits on.

## Composing it

`ground` describes a material, so give it something with a visible boundary
to sit on - a code block, an inline `<code>`, a card - rather than the bare
page background. On fine pointers, showing it only on hover of a `code-shell`
ancestor is common; on coarse pointers keep it always visible, since
"appears on hover" cannot happen without a hover to begin with.

## When not to use it

Copying something longer than a short string - a whole file, a large JSON
blob a reader would want to inspect before trusting - is better served by
`CodeBlock`, which pairs the same button with the content it is copying.
