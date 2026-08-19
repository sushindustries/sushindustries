---
title: How to add something here
date: 2026-08-16
summary: The four things you can add to this repo, and the exact steps for each.
tags: [conventions, workflow]
---

Four kinds of thing get added to this repo: a post, a component, a package, and
an endpoint. Each has one correct place to go and one procedure. This is that
procedure.

> [!NOTE] The rule underneath all of it
> Anything visible on this site is a component in `@sushindustries/ui`. The
> site imports the library the way a stranger would, so nothing can be
> "working" only for me.

## Add a post

One file. That is the whole procedure.

```shell
touch apps/web/content/posts/my-post.md
```

Give it frontmatter and a body:

```md
---
title: My post
date: 2026-08-16
summary: One line for the index page.
tags: [something]
draft: true
---

Body text starts here.
```

It appears at `/posts/my-post` on the next build. `draft: true` keeps it off
the index while you write. There is no index to update - the site globs the
directory, because an index is a thing that drifts.

## Add a component

Components live in `packages/ui/src`, one file each, kebab-case.

<!-- ::start:tabs -->

### 1. Write it

```tsx
// packages/ui/src/my-thing.tsx
import type { ReactNode } from "react";

export interface MyThingProps {
	title: string;
}

export function MyThing({ title }: MyThingProps): ReactNode {
	return <div className="card">{title}</div>;
}
```

Emit atomic class names. Do not write a stylesheet for one component - if a
value is missing, add it to the scale in `@sushindustries/atoms`.

### 2. Export it

```ts
// packages/ui/src/index.ts
export { MyThing, type MyThingProps } from "./my-thing";
```

Also add a subpath to `exports` in `packages/ui/package.json`, so it can be
imported on its own without pulling the barrel.

### 3. Document it

```shell
touch packages/ui/docs/my-thing.md
```

The doc renders at `/components/my-thing`, and the demo block inside it renders
the real component - not a screenshot of one.

<!-- ::end:tabs -->

> [!TIP] Why the doc lives in the package
> Because anyone who installs `@sushindustries/ui` gets it. Documentation that
> ships beside the code cannot drift from the version you actually installed.

## Add a package

```shell
mkdir -p packages/my-thing
```

It needs exactly two files to appear on the site:

| File | Why |
| --- | --- |
| `package.json` | `name`, `version`, `description` - the card |
| `README.md` | the body of `/packages/my-thing` |

Mark it `"private": true` to keep it off the site. Add it to
`pnpm-workspace.yaml` only if it is outside `packages/*`, which it should not
be.

If it touches secrets or a database, the connection goes in a `.server.ts`
file. That suffix is in TanStack Start's default client deny list, so importing
it from the browser is a build error rather than a review comment.

## Add an endpoint

This is the one with a real decision in it, and the answer is usually "server
function".

| You need | Use | Where |
| --- | --- | --- |
| Data for a page, per visitor | server function | `*.functions.ts` |
| Static content, same for everyone | `import.meta.glob` | `*.catalogue.ts` |
| A webhook, a health probe, `robots.txt` | server route | `routes/*.ts` |

Server routes are for things where the caller is not this app - where HTTP
semantics are the point. Everything else is a server function, because that
keeps end-to-end types and costs no round trip.

```ts
// modules/<domain>/<feature>/<resource>.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createThing = createServerFn({ method: "POST" })
	.validator(z.object({ name: z.string().min(1) }))
	.handler(async ({ data }) => {
		const { insertThing } = await import("./thing.server");
		return insertThing(data);
	});
```

> [!CAUTION] Two rules that are not style preferences
> Every mutation validates its input at runtime - a `.validator()` before the
> `.handler()`. And a loader is isomorphic, not server-only: it runs in the
> browser too, so it must never touch a secret directly.

## What gets checked

```shell
pnpm build
pnpm typecheck
pnpm exec biome check .
```

All three before pushing. The build is the one that catches a broken import
boundary, because import protection fails the build rather than warning.
