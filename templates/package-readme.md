<!-- template
target: packages/{slug}/README.md
tokens: slug, name, description
-->
# {name}

{description}

The site renders this file at `/packages/{slug}`, so it is the package's page.
Write it for someone who has never seen the repo.

## Install

```bash
pnpm add {name}
```

## Use

```ts
import { something } from "{name}";
```

## Why it exists

The reason this is a package rather than a file in the app. If the answer is
"so the site can import it", it is not a package - it is a module, and it
belongs in `apps/web/src/modules/`.

## Credits

Anything this is built on, named. Depending on someone's work and not saying so
is the one thing that is never a style question.
