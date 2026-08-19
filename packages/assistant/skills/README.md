---
title: Skills
summary: What the assistant can do, one Markdown file each. The shape is declared here; the work is done by whoever mounts it.
---

# Skills

A skill is a thing the assistant can *do* rather than a thing it knows. Each
one is a Markdown file in this directory, and each file declares a name, a
description, and a table of parameters.

```text
packages/assistant/skills/
├── README.md              this file
├── find-component.md
├── read-doc.md
├── list-packages.md
└── site-stats.md
```

## Why Markdown

The same reason the glyphs and the devices are Markdown: the file is read far
more often than it is changed, and the part that matters most is prose.

A skill's `description` is not documentation, it is **the instruction the model
reads to decide whether to call it**. It is prompt text with a function
signature attached. Writing that in a TypeScript object literal buries the most
important sentence in the file inside a string, three levels into an argument,
where nobody reviews it.

These files are also published. `/llms.txt` lists them, so a crawler or another
assistant can see what this one is able to do without being told separately -
which is the whole point of having an `llms.txt` at all.

## The format

Frontmatter declares the identity:

```yaml
---
name: find_component
summary: Look up a component by name or by what it should do.
---
```

| Key | Required | What it is |
| --- | --- | --- |
| `name` | yes | The function name the model calls. `snake_case`, because that is what every provider's schema expects and a name that has to be transformed is a name that can be transformed wrongly. |
| `summary` | yes | The one line the model reads when deciding. Written *at* the model, in the imperative. |

Then a `## Parameters` table, which becomes the input schema:

```markdown
## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| query | string | yes | A component name, or words describing what it should do |
| limit | number | no | How many to return. Default 5 |
```

| Column | Notes |
| --- | --- |
| `Name` | The property name. |
| `Type` | `string`, `number` or `boolean`. Deliberately three: a skill that needs a nested object is a skill that is doing two things. |
| `Required` | `yes` or `no`. Anything else is a build error rather than a guess. |
| `Description` | Also prompt text. The model reads this to fill the argument. |

Everything after the table is for whoever opens the file and is never sent.

> [!NOTE] Why the type list is short
> A JSON Schema generator that accepts arbitrary nesting is a small compiler,
> and every provider disagrees about the edges of it. Three scalar types cover
> every skill here and cannot be wrong.

## Declared here, done elsewhere

**This package declares the shape of a skill and never implements one.**

A skill's work is always about the host - searching *this* registry, reading
*these* docs, counting *these* rows. A package that shipped handlers could only
ever serve one site, which is the same reason `AssistantPanel` takes
`renderMarkdown` instead of choosing a parser.

So `readSkills()` returns definitions, and the host binds each name to a
function:

```ts
const tools = bindSkills(skills, {
	find_component: async ({ query }) => searchRegistry(String(query)),
	read_doc: async ({ slug }) => findDoc(String(slug))?.body ?? null,
});
```

A skill with no handler is left out of the list sent to the model, rather than
being advertised and then failing when it is called. A model told it can do
something and then told it cannot is a model that apologises and tries again.

## Adding one

1. Write `skills/<name>.md`.
2. Bind the name in the host's skill map.
3. `pnpm run doctor`, which fails on a skill with no handler and on a handler with
   no skill.

There is no list to update. The directory is the list.
