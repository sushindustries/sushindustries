---
name: adam-jurek
description: Building with the Adam Jurek design system - installing components through npm, shadcn or the TanStack CLI, styling with the atoms stylesheet, and the conventions that keep a project in its voice. Use when adding these components to any project, or when a project wants to be built the way adamjurek.com is.
---

# Building with the Adam Jurek system

Everything on adamjurek.com is made of installable pieces: a component
library, one stylesheet, and machine-readable endpoints that serve both. This
skill is how an agent uses them in someone else's project.

## Three doors, one system

| Door | When | Command |
| --- | --- | --- |
| **npm** | you want the library as a dependency, updated by version | `pnpm add @sushindustries/ui @sushindustries/atoms` |
| **shadcn** | you want to own the source of a few components | `pnpm dlx shadcn@latest add <site>/r/shadcn/<name>.json` |
| **TanStack CLI** | you are scaffolding with `tanstack create` | `--add-ons <site>/r/registry.json` |

`<site>` is the deployment of the registry - the canonical one is the
homepage named in the shadcn index at `/r/shadcn/registry.json`. Configure it
once as a named registry and install by name afterwards:

```jsonc
// components.json
{ "registries": { "@adamjurek": "<site>/r/shadcn/{name}.json" } }
```

```bash
pnpm dlx shadcn@latest add @adamjurek/consent
```

## The stylesheet is not optional

Every component styles itself with class names from the atoms stylesheet and
ships no CSS of its own. The npm door gets it as a package; import it once at
the app root:

```ts
import "@sushindustries/atoms/atoms.css";
```

The shadcn door delivers it automatically - each item lists the `atoms`
registry item as a dependency, and the CLI writes the bundled CSS to
`src/sushindustries/atoms.css`. Import that file once. A component rendering
unstyled means this import is missing, nothing else.

## The rules that keep it coherent

- **Compose atoms in markup.** Utility classes first; reach for a named block
  class only when a layout would take six utilities to say.
- **Tokens, not literals.** Spacing is `--s-*`, radii `--r-*`, stacking
  `--z-*`, colors semantic (`--fg`, `--bg-0`, `--line`). A hard-coded value
  is a bug report waiting for a theme change.
- **Both themes always.** Everything is styled through tokens that flip with
  `data-theme`; test both before calling anything done.
- **Reduced motion keeps the information.** Remove the flourish, never the
  meaning - a loader still loads, a reveal still appears.
- **Anything that touches visitor data walks the legal checklist first**:
  name the data, name the basis, gate it behind explicit consent with
  equal-weight buttons, and update the privacy and cookies pages in the same
  change.

## The voice, if the project wants it

First person singular. Comments explain what the code avoids, not what it
does. A heading earns its place by giving the reader something to take away.
Every visible element is a reusable component first and a page second - the
site is the library's first consumer, never a special case of it.
