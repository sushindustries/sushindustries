# @sushindustries/adam-jurek

The whole system in one install. This package re-exports every component in
`@sushindustries/ui` and depends on `@sushindustries/atoms`, so one
dependency line and one stylesheet import is the entire setup.

It is **private on purpose**. The pieces are what publish - each component
installs on its own through three doors - and this bundle exists for the one
consumer that genuinely wants all of it: a project that is being built as an
Adam Jurek project from the first commit.

## Install

```bash
pnpm add @sushindustries/ui @sushindustries/atoms
```

Those two are this package, for anyone outside this repository - the
umbrella itself is private, so its install command is the two things it
wraps. Inside the workspace it is `"@sushindustries/adam-jurek": "workspace:*"`.

## The one-sentence setup

```ts
import { Consent, ScrollSpin, FolderShelf } from "@sushindustries/adam-jurek";
import "@sushindustries/atoms/atoms.css";
```

The stylesheet stays an explicit import because CSS is not re-exportable -
and because knowing where the cascade comes from is worth one line.

## The three doors, for everyone else

| Door | What it is | One-time setup |
| --- | --- | --- |
| **npm** | `pnpm add @sushindustries/ui @sushindustries/atoms` | none |
| **shadcn** | copy-paste ownership of single components, stylesheet included automatically | `"registries": { "@adamjurek": "<origin>/r/shadcn/{name}.json" }` in `components.json` |
| **TanStack CLI** | add-ons with pinned versions, for `tanstack create` projects | none - point `--add-ons` at `/r/registry.json` |

Every component page on the site prints its own commands for all three, and
the shadcn payloads carry the stylesheet as a registry dependency - a copied
component arrives styled, not naked.

## What does not belong here

Anything. A component that would earn a line of its own in this package
belongs in `ui`; a style belongs in `atoms`. The umbrella that starts
accumulating its own code is two packages wearing one name.
