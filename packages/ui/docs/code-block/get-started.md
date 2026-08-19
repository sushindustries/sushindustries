---
title: Get Started
summary: Render Code Block once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { CodeBlock } from "@sushindustries/ui";

export function Example() {
	return (
		<CodeBlock
			code={`export function greet(name: string): string {\n\treturn \`hello, \${name}\`;\n}`}
			language="ts"
		/>
	);
}
```

## What you should see

A warm charcoal slab with a lit top edge, the code coloured in the CLI's own
syntax palette, and a language chip and copy button in the bottom right. The
trailing newline in `code` is dropped before rendering, so what the block
shows and what the copy button puts on the clipboard are exactly the same
text.

## If nothing happens

An unrecognised `language` does not error - it falls back to `plaintext` and
renders unstyled but otherwise correct. If the copy button or the language
chip is missing entirely, check that `icon` and `copy-button` are installed
alongside this component; `registry.ts` lists both as dependencies rather than
bundling them in.
