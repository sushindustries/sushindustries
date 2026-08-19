# TanStack Start: Official + Safety facts this repo checks

Our own restatement, for our own purpose - not a pointer to any global or
foreign-repo skill. Written from the framework's own documented behavior and
the installed `@tanstack/react-start` type definitions, checked against this
repo's actual code, not copied from somewhere else's project conventions.

| Fact | Classification | What breaks it |
| --- | --- | --- |
| A file route exports its instance as `Route` | Official | `routeTree.gen.ts` generation and the router plugin can't find an unexported route |
| `loader` is isomorphic - it runs on server and client both | Official | Direct `db`/`.server.ts` access inside a loader ships a driver or a secret to the browser bundle |
| `createServerFn` validates input with `.validator(...)` | Official | `.inputValidator(...)` is the deprecated alias - confirmed in the installed types, not just claimed |
| A mutation (`POST`/`PUT`/`PATCH`) validates its body before using it | Official + Safety | Unvalidated input is attacker-shaped data one request from a database write |
| Server routes exist only for real HTTP semantics (streaming, webhooks, crawler files, health) | Official + this repo's own convention | Internal app RPC belongs in a server function, not a server route |
| Request middleware uses `createMiddleware({ type: "request" })` (or its default) | Official | The function-only middleware type doesn't run for plain requests |
| `createStart`'s `requestMiddleware` array keeps CSRF middleware wired in | Official | Editing `start.ts` without preserving it silently drops CSRF protection |
| `getRouter()` returns a fresh router instance every call | Official | A shared singleton leaks one visitor's loader data into the next request |
| No `VITE_*` variable holds a secret | Safety | `VITE_` prefixes ship straight into the client bundle |
| Import protection denies `.server.*` from client code by default | Official | Any leak here is a build-time failure this repo relies on, not something to work around |

## Where this repo draws its own line

TanStack Router officially supports flat, directory, and mixed route
structures - none of that is a violation. This repo's actual layout rules
(where a file goes, what it's named, when a dynamic segment must stay flat)
are `sushindustries-conventions`' job, not this file's. This file only
covers the facts above: things that are true of TanStack Start itself,
regardless of which app is built on it.
