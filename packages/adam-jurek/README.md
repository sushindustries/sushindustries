# @sushindustries/adam-jurek

The whole system in one install. This package re-exports every component in
`@sushindustries/ui` and depends on `@sushindustries/atoms`, so one
dependency line and one stylesheet import is the entire setup.

The pieces still publish on their own - each component installs through
three doors - and this bundle exists for the one consumer that genuinely
wants all of it: a project that is being built as an Adam Jurek project
from the first commit.

## Install

Private on purpose - it does not publish, so there is no registry door for
it. `ui` and `atoms` are the two real doors, and each publishes on its own;
see [the three doors below](#the-three-doors-for-everyone-else).

Inside this workspace it is `"@sushindustries/adam-jurek": "workspace:*"` -
that is the one place this package is ever actually depended on.

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
