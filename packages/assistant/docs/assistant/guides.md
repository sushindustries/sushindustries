---
title: Guides
summary: Using Assistant well, and the mistakes that look like it is broken.
---

## The shape of it

```text
packages/assistant/
├── persona.md               the model, the settings, the system message
└── src/
    ├── assistant-panel.tsx  the terminal. Holds nothing, talks to nothing
    ├── use-conversations.ts previous chats, in localStorage
    └── persona.ts           persona.md in, a system message out

apps/web/src/
├── routes/api/chat.ts               the stream. Groq, and the only place the key is read
└── modules/assistant/
    ├── persona.server.ts            the file, inlined at build time
    └── site-assistant.tsx           the panel, wired to this site
```

## It holds nothing and talks to nothing

Messages, status, and what to do with a new line of text are all props.

That is what makes it installable: a panel that owned its own `fetch` is a
panel you can only see working by having an API key. `renderMarkdown` is the
same idea one level down - this package has no business picking a parser or a
highlighter for its host. Leave it out and messages render as plain text, which
is correct rather than broken.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## History lives in the browser

| | |
| --- | --- |
| Where | `localStorage`, under `sushindustries.chats` |
| Sent anywhere | No. Only the current transcript goes to the model answering it |
| Cleared by | One button, which talks to nothing |

There is no account here and no database row. A conversation happened in one
browser and stays in it.

`useConversations` follows the same two rules as `useDeskState`, because it is
the same problem:

**The first render is always empty**, on the server and the client alike, with
storage read in an effect afterwards. Reading `localStorage` during render
produces markup the server could not have sent, and React answers a mismatch by
throwing the tree away - which on a panel of buttons means every button briefly
does nothing.

**None of it is required.** Storage can be full, disabled, or refused by a
private window. A transcript that is not kept lasts until the tab closes, which
is a perfectly good chat, so every access is wrapped and every failure silent.

Starting a chat only clears the selection - nothing is written until something
is said. So pressing New twice cannot leave two empty rows in the sidebar,
which is a state every chat app has to special-case afterwards and this one
simply cannot reach.

## Streaming, on a budget

Tokens arrive faster than sixty times a second, and each one would otherwise
reparse the whole Markdown document and re-run the syntax highlighter over
every fence in it. The highlighter is synchronous by design - that is what
makes server rendering possible, and also what makes calling it two hundred
times a second a bad idea.

```tsx
const [transcript] = useThrottledValue(chat.messages, { wait: 60 });
```

60ms is under the threshold where text stops looking live and comfortably above
the cost of a reparse. Nothing is dropped: throttling delays a render, it does
not skip content, and the trailing edge always lands.

The panel is unaware of any of it. It takes messages as a prop and has no
opinion about how often they change.

## The personality is a Markdown file

`persona.md` carries the model, the temperature, the token ceiling, and the
system message under a `## System` heading. Everything above that heading is
for whoever opens the file and is never sent - a note explaining *why* a rule
exists would otherwise become another instruction, which is how a prompt starts
arguing with itself.

`situate(persona, "phone")` appends the machine to the system message. It is a
fact about the situation rather than something anybody typed, so it is not a
user turn: a user turn would show up in the transcript, and the reader did not
say "I am on a phone".

The machine comes from `useDeviceKind`, which reads the same table the
stylesheet compiles its media queries from - so what the model is told and what
is actually drawn cannot disagree.

> [!CAUTION] The persona file is public
> It ships in the package, and a system message is one jailbreak away from
> being quoted back verbatim. Nothing secret goes in it.

## The wire

```ts
const stream = chat({
	adapter: createGroqText(persona.model, key),
	systemPrompts: [situate(persona, device)],
	messages,
	modelOptions: {
		temperature: persona.temperature,
		max_completion_tokens: persona.maxTokens,
	},
});

return toServerSentEventsResponse(stream);
```

Three things there are worth knowing, and each of them is a mistake this
already made:

**`systemPrompts`, never a `role: "system"` message.** The engine keeps system
prompts out of the transcript and hands them to the adapter to place in
whatever shape the provider wants. Pushing one into `messages` works today and
breaks the day a provider expects `instructions` instead of a leading message.

**`modelOptions`, with provider-native names.** Sampling options used to sit on
the root of `chat()` and were moved precisely because they are not the same
everywhere. Groq's ceiling is `max_completion_tokens`, not `max_tokens` -
exactly the sort of thing a common wrapper gets to be quietly wrong about and a
typed provider option cannot.

**A server route, not a server function.** The caller wants a long-lived
`text/event-stream` and reads it with a plain `fetch`. That is HTTP semantics,
which is the whole justification server routes exist for; a server function
would wrap the same bytes in an RPC envelope the client has to unwrap before it
can stream anything.

## The model name is checked

`createGroqText` takes a union rather than a string, which is the adapter doing
this repo a favour. `model:` in `persona.md` is free text, and a typo would
otherwise be a 404 from Groq on the first message somebody sent rather than an
error at build time.

`persona.server.ts` checks the name against the models Groq serves and throws
with the list if it does not match. The cast at that boundary is verified
rather than asserted.

## Configuring it

| Variable | Where | If it is missing |
| --- | --- | --- |
| `GROQ_API_KEY` | Railway, or `.env` locally | `/api/chat` returns 503 with a plain sentence, and the panel shows it |

It fails closed on purpose. Without a key this is not a degraded assistant, it
is no assistant, and 503 means "the thing behind me is not there" - which is
better than an empty reply that reads like the model had nothing to say.

## Where this is used

| Where | What |
| --- | --- |
| `content/shelf.md` | the `Assistant` entry, with the `chat` glyph |
| `shelf-page.tsx` | the one entry whose window is a live component rather than a lookup |
| `atoms.css`, `term-*` | every class it uses |
