---
title: Examples
summary: Assistant in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

This is the real thing, on the real desk. Open **Assistant** below and it is
this site's own instance - the same persona, the same skills, the same
history in your browser.

<!-- ::start:device from="home" kind="laptop" title="SUSHINDUSTRIES" -->
<!-- ::end:device -->

## In a page

This site wires the panel to TanStack AI's `useChat`, a server-sent-events
route, and `useConversations` for history - none of which `AssistantPanel`
knows exist:

```tsx
import { AssistantPanel, useConversations } from "@sushindustries/assistant";
import { useChat, fetchServerSentEvents } from "@tanstack/react-ai";

export function SiteAssistant() {
	const history = useConversations("sushindustries.chats");
	const chat = useChat({ connection: fetchServerSentEvents("/api/chat") });

	return (
		<AssistantPanel
			messages={chat.messages}
			streaming={chat.status === "streaming"}
			onSend={chat.sendMessage}
			threads={history.all}
			activeThread={history.current?.id ?? null}
			onOpenThread={history.open}
			onNewThread={history.start}
			onDeleteThread={history.remove}
		/>
	);
}
```

## What this example is not

`useChat` and the `/api/chat` route are this site's transport, not part of
this package. `AssistantPanel` never imports a fetch client or a streaming
library - swap in a different model, a different provider, or a plain
`fetch` and nothing here changes.
