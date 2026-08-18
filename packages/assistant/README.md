# @sushindustries/assistant

A chat panel that streams Markdown, told which machine it is running on.

See it running as the site's own [Assistant](/components/assistant) terminal.

## Install

```shell
pnpm add @sushindustries/assistant @sushindustries/atoms
```

## Use

```tsx
import { AssistantPanel } from "@sushindustries/assistant";

<AssistantPanel
	messages={messages}
	streaming={status === "streaming"}
	onSend={(text) => sendMessage({ content: text })}
	renderMarkdown={(source) => <MarkdownView source={source} />}
/>;
```

## It holds nothing and talks to nothing

Messages, status and "here is a new line of text" are all props. The transport
is the host's - on this site that is TanStack AI's `useChat` over a server
route talking to Groq, and the panel cannot tell.

That is what makes it installable. A panel that owned its own `fetch` would be
a panel you could only see working by having an API key.

`renderMarkdown` is the same idea one level down: this package has no business
picking a parser, a highlighter or a theme for its host. Leave it out and
messages render as plain text, which is correct rather than broken.

## The personality is a Markdown file

`persona.md` holds the model, the temperature, and the system message under a
`## System` heading. Everything above that heading is for whoever opens the
file and is never sent - a note explaining *why* a rule exists would otherwise
become another instruction, which is how a prompt starts arguing with itself.

`situate(persona, "phone")` appends the machine to the system message. It is a
fact about the situation rather than something anybody typed, so it is not a
user turn - a user turn would also show up in the transcript, and the reader
did not say "I am on a phone".

> [!CAUTION] The file is public
> It ships in the package, and a system message is one jailbreak away from
> being quoted back. Nothing secret goes in it. The key is read from the
> environment inside the host's handler.

## What it does about streaming

| Thing | Why |
| --- | --- |
| Follows the bottom, unless you scrolled up | Getting yanked away from an answer you went back to reread is the most annoying thing a chat panel does. Sixty pixels of slack. |
| A caret only while the reply is empty | The gap before the first token is where a panel looks broken. Once there is text, the text is the progress. |
| `aria-live="polite"`, `aria-atomic="false"` | Assertive would interrupt a screen reader on every token; atomic would reread the whole transcript each time. |
| Enter sends, Shift+Enter breaks | The convention every chat box has and none of them explain. |
