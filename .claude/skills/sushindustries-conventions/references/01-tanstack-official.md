# TanStack Start, officially

- last_verified_at: 2026-08-19
- verified_against: this repo's installed packages, not docs pages alone

| Package | Version |
| --- | --- |
| `@tanstack/react-start` | 1.168.46 |
| `@tanstack/react-router` | 1.170.29 |
| `@tanstack/start-client-core` | 1.170.24 |
| `@tanstack/start-server-core` | 1.169.28 |
| `@tanstack/start-plugin-core` | 1.171.36 |

```bash
ls -d node_modules/.pnpm/@tanstack+react-start@*/node_modules/@tanstack/react-start
```

Official facts live here. What this repo decided lives in `rules/`. The
difference matters: an official fact is not negotiable and not ours to change,
and a convention is both.

## Execution model

- Start code is **isomorphic unless explicitly constrained**. A route loader
  is not server-only: it runs on the server during SSR and in the browser on
  every client-side navigation.
- Secrets, database access, filesystem access and privileged SDK calls must
  sit behind a server-only or server-function boundary.
- The primitives are `createServerFn`, `createServerOnlyFn`,
  `createClientOnlyFn` and `createIsomorphicFn`.

This is the fact behind `packages/db/src/client.server.ts` and every
`*.server.ts` in `apps/web/src/modules/`.

## Server functions

- `createServerFn()` defines one. GET is the default;
  `createServerFn({ method: "POST" })` for the rest.
- The chain is `createServerFn({ method })`, then optional `.validator(...)`,
  then optional `.middleware(...)`, then `.handler(...)`.
- They are same-origin app RPC endpoints, protected by Fetch Metadata, Origin
  and Referer checks plus CSRF middleware. **A project defining its own
  `src/start.ts` must preserve that CSRF middleware explicitly** - ours does,
  first in `requestMiddleware`.
- They can be called from loaders, components, hooks and other server
  functions, and can throw errors, redirects and not-found responses.
- Larger-app organisation splits `*.functions.ts` wrappers from `*.server.ts`
  helpers, with client-safe schemas unsuffixed. Static imports are safe;
  dynamic imports are warned against.

## Server routes

- Declared by adding `server` to `createFileRoute(...)(...)`:
  `server.handlers` for plain method handlers, `createHandlers` when a handler
  needs middleware, `server.middleware` for route-level middleware.
- Duplicate route paths with duplicate HTTP methods are invalid.
- Intended for raw HTTP semantics: webhooks, health and readiness probes, auth
  provider endpoints, files, and machine-readable public endpoints. That is
  the whole justification list for ours: `health.ts`, the crawler files, the
  Markdown mirrors and `/r/*`.

## Middleware

- Two kinds. Request middleware is `createMiddleware()` and only has
  `.server(...)`; it runs for server requests, server routes, SSR and server
  functions. Server-function middleware is
  `createMiddleware({ type: "function" })` and can define `.client(...)`,
  `.server(...)` and `.validator(...)`.
- The two `.validator(...)` methods share a name and belong to different chain
  objects. Do not migrate one based on the other's examples.
- Client context is not sent to the server by default. `sendContext` is
  explicit, and anything user-generated in it must be validated server-side
  before it is trusted.
- Global request middleware is configured through
  `createStart(() => ({ requestMiddleware: [...] }))` in `src/start.ts`.

## Import protection

- **Enabled by default.** Development defaults to mock or warning behaviour;
  production builds error.
- The default client denial covers `**/*.server.*` and Start server
  specifiers; the default server denial covers `**/*.client.*`.
  `node_modules` is excluded.
- Type-only imports and re-exports are ignored, because they are erased before
  runtime. Mixed imports still count when they carry runtime values.
- Marker imports remain available: `@tanstack/react-start/server-only` and
  `@tanstack/react-start/client-only`.
- `importProtection: { enabled: false }` disables it and needs an explicit
  human decision.

See `02-api-drift.md` for what "enabled by default" does not cover.

## Routing

- Router officially supports flat, directory and mixed route file structures.
  A preference between them is a convention, never an official requirement.
- `routeTree.gen.ts` is generated whenever Start runs, including `dev` and
  `build`. It is not hand-edited.
- `src/router.tsx` owns router creation and returns a fresh instance per call.
- The Start plugin can customise `srcDirectory` and `router.routesDirectory`.
  Derive the route root from config rather than assuming `src/routes`. Ours
  uses the defaults.

## SSR and hydration

- Routes render with SSR by default. Route-level `ssr` and app-level
  `defaultSsr` control selective SSR.
- Hydration errors come from locale and time-zone differences, `Date.now()`,
  random ids, responsive-only logic, feature flags and user preferences.
  Pinning both the locale and the time zone is a stabilisation strategy;
  pinning only the locale is not.

## Refresh triggers

Refresh this file when Start changes stable v1 guidance, when
`createServerFn`, `.validator()`, middleware, import protection, `getRouter()`
or the SSR options change, or when the versions above move materially.
