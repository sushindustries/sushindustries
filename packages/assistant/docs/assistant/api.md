---
title: Assistant API
summary: AssistantPanel's props, and the persona, history and skill parsers that sit beside it. Written by hand - this package has no registry entry to generate from.
---

## AssistantPanel

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `messages` | `readonly AssistantMessage[]` | - | The transcript. The panel holds none of its own. |
| `streaming?` | `boolean` | `false` | Disables the field and shows a caret after the last message while it is empty. |
| `onSend` | `(text: string) => void` | - | Called with the trimmed field value on submit. The panel does not append to `messages` itself - the caller does, however it talks to a model. |
| `error?` | `string \| null` | - | Shown under the log in `role="status"`. Left unset, nothing renders. |
| `renderMarkdown?` | `(source: string) => ReactNode` | - | Renders one message. Left out, messages render as plain text - correct rather than broken, and the package needs no Markdown dependency. |
| `greeting?` | `ReactNode` | - | Shown above an empty log. Can hold links or a list - it is a `div`, not a `p`. |
| `placeholder?` | `string` | `"Ask about this site"` | The field's placeholder and its `aria-label`. |
| `sendIcon?` | `ReactNode` | - | The send button's glyph. Left out, the button reads "Send". |
| `mark?` | `ReactNode` | - | The name in the banner, between the two `//`. Text by default. |
| `openers?` | `readonly string[]` | - | Buttons shown before the first message. Each string is sent verbatim through `onSend` when pressed, and all of them disappear once there is a transcript. |
| `threads?` | `readonly AssistantThread[]` | - | The sidebar's rows. Leaving it out removes the sidebar entirely - a one-column panel with no history. |
| `activeThread?` | `string \| null` | - | Which thread id is highlighted in the sidebar. |
| `onOpenThread?` | `(id: string) => void` | - | Called when a sidebar row is pressed. |
| `onDeleteThread?` | `(id: string) => void` | - | Shown as a `×` on each row only when this is given. |
| `onNewThread?` | `() => void` | - | Shows a "New" button in the sidebar header only when this is given. |

## Persona

```ts
parsePersona(source: string): Persona
situate(persona: Persona, device: string | null): string
```

`parsePersona` reads a `persona.md` file: frontmatter for `model`,
`temperature` and `maxTokens`, and the `## System` heading's body as
`system`. Everything above that heading - notes, rationale - is never
returned, so it can never end up in a request. `situate` appends a line
naming the reader's device to the system message, or returns it unchanged
when `device` is `null`.

## useConversations

```ts
useConversations(key: string): ConversationsApi
```

Previous chats, kept in `localStorage` under `key` and nowhere else. Returns
`{ all, current, ready, start, open, remove, record, clear }`. `ready` is
`false` on the first render, on the server and the client alike - the same
contract `useDeskState` follows, for the same reason: storage is read in an
effect, never during render. `record` takes the whole transcript on every
call rather than appending, because that is what a stream produces - the
last message grows in place, with no event that means "one message
finished".

## Skills

```ts
parseSkill(source: string): Skill | null
skillProblems(skills: readonly Skill[]): string[]
skillSchema(skill: Skill): { type: "object"; properties: ...; required: string[] }
bindSkills(skills: readonly Skill[], handlers: Record<string, SkillHandler>): BoundSkill[]
```

A skill is a `name`, a `summary` and a table of `parameters`, parsed from a
Markdown file's frontmatter and its `## Parameters` table. `skillSchema`
turns one into the JSON Schema every provider's tool-calling API wants.
`bindSkills` pairs declared skills with the handlers a host actually
implements - a skill with no handler is dropped rather than advertised,
because a model told it can do something and then told it cannot does not
stop, it apologises and tries again.

## Notes

`parsePersona` never throws on a malformed file - a missing `## System`
heading produces an empty `system` string rather than an error, which is a
model with no instructions rather than a build failure. Catching that is the
caller's job.

`skillProblems` is meant for a build-time check, not a runtime one: it
returns sentences rather than throwing, so a doctor script can print every
problem across every skill file in one pass instead of stopping at the
first.
