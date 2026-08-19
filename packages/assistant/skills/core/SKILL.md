---
name: core
description: >
  How @sushindustries/assistant stays a pure props-in panel with no owned
  transport, how persona.md's pre-System content differs from what actually
  reaches the model, and the JSX comment-escaping trap in the banner. Load
  when wiring up AssistantPanel, editing persona.md, or streaming messages
  into it.
metadata:
  type: core
  library: '@sushindustries/assistant'
  library_version: '0.1.0'
sources:
  - 'sushindustries/sushindustries:packages/assistant/README.md'
  - 'sushindustries/sushindustries:packages/assistant/persona.md'
---

## Setup

```tsx
import { AssistantPanel } from "@sushindustries/assistant";

<AssistantPanel
	messages={messages}
	streaming={status === "streaming"}
	onSend={(text) => sendMessage({ content: text })}
	renderMarkdown={(source) => <MarkdownView source={source} />}
/>;
```

## Core Patterns

### The panel holds nothing and talks to nothing

Messages, status, and send are all props. The transport - `fetch`, a
WebSocket, whatever the host uses - stays entirely in the host; the panel
cannot tell what it's talking to and doesn't need to.

### `renderMarkdown` is the same idea, one level down

The package has no business picking a parser, a highlighter, or a theme.
Leave it out and messages render as plain text - correct behavior, not a
broken fallback.

### The personality lives in `persona.md`, only the `## System` heading matters

```markdown
Notes for whoever opens this file - never sent anywhere.

## System

Everything from here down is the actual system message.
```

`situate(persona, "phone")` appends a fact about the runtime ("you are on a
phone") to the system message - not a user turn, because the reader did not
type it.

## Common Mistakes

### [HIGH] Giving the panel its own transport instead of relaying through props

Wrong: wiring a fetch call or a chat client *inside* how the panel is used,
bypassing `onSend`/`messages` as the single channel.

Correct: keep every network call in the host; the panel only ever receives
props and calls `onSend`.

A panel that owns its own fetch only works by embedding an API key inside
it - which is the whole reason it stops being installable anywhere else.

Source: sushindustries/sushindustries:packages/assistant/README.md (It holds nothing and talks to nothing)

### [HIGH] Treating everything in `persona.md` as part of the prompt

Wrong: assuming a note written above the `## System` heading reaches the
model.

Correct: only the content under `## System` is sent. Everything above it is
a note for a human reader and nothing else.

Treating a maintainer's note as an instruction is how a prompt starts
arguing with itself - the split exists specifically so that never happens.

Source: sushindustries/sushindustries:packages/assistant/persona.md

### [MEDIUM] Putting anything secret in `persona.md`

Wrong: writing an API key, internal URL, or other secret directly into the
persona file.

Correct: nothing secret goes in this file at all. Keys are read from the
environment inside the host's own handler.

`persona.md` ships inside the published package, and a system message is
one jailbreak prompt away from being quoted back to whoever asks for it.

Source: sushindustries/sushindustries:packages/assistant/persona.md

### [MEDIUM] Writing a bare `//` inside JSX children

Wrong:

```tsx
<span>{"//"} sushi industries //</span>
```

if the second `//` is written literally, unescaped, as JSX text.

Correct: wrap every literal slash pair the same way:

```tsx
<span className="term-slash">{"//"}</span>
<span className="term-mark">sushi industries</span>
<span className="term-slash">{"//"}</span>
```

JSX reads a bare `//` in children as the start of a line comment and drops
the rest of that line silently - the banner renders with no slashes at all
and nothing in the output says why.

Source: sushindustries/sushindustries:packages/assistant/README.md (The banner is three elements)
