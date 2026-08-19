---
title: Get Started
summary: Install the package, then hand the panel a transport - it holds no messages and talks to nothing on its own.
---

## Install

```shell
pnpm add @sushindustries/assistant
```

There is no registry entry for this package - it is not a `packages/ui`
component, so there is no TanStack or shadcn command to run alongside it.

## Use it

```tsx
import { AssistantPanel, type AssistantMessage } from "@sushindustries/assistant";
import { useState } from "react";

export function Example() {
	const [messages, setMessages] = useState<AssistantMessage[]>([]);

	function onSend(text: string) {
		setMessages((current) => [
			...current,
			{ id: crypto.randomUUID(), role: "user", content: text },
		]);
	}

	return <AssistantPanel messages={messages} onSend={onSend} />;
}
```

## What you should see

A dark terminal panel: a `// sushi industries //` banner, an empty log, and a
prompt at the bottom with a `>` and a text field. Type something and press
Enter - it appears in the log with a `>` sigil, because this example never
calls anything that answers. `AssistantPanel` renders exactly what `messages`
holds; without a real backend wired to `onSend`, nothing replies.

## If nothing happens

If the field never grows past one line or Enter inserts a newline instead of
sending, this component is not the cause - `onSend` runs on Enter and
Shift+Enter breaks the line, with no prop to change either. The two real
failure modes are: no `onSend` handler at all, and `streaming` left `true`
forever, which disables the field.
