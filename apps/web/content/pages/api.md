---
title: API
summary: The read API. Versioned, discoverable from its root, and rendered from the same data as the pages.
updated: 2026-08-17
draft: false
---

Everything the site knows about itself, as JSON. The API is versioned in the
path from day one and describes itself at its root, so the documentation you
are reading and the machine-readable form of it cannot drift apart - both are
rendered from the same catalogues.

## The front door

```shell
curl https://sushindustries.com/api/v1
```

Returns the endpoint list with descriptions - the API documents itself before
this page does.

## Components

Every registry item, with its version, kind, category, tags, files and
dependencies:

```shell
curl https://sushindustries.com/api/v1/components
```

One item, with every address it answers at - page, Markdown, agent prompt and
both installers:

```shell
curl https://sushindustries.com/api/v1/components/code-block
```

## Packages

```shell
curl https://sushindustries.com/api/v1/packages
```

## Ground rules

- **Read-only.** Everything under `v1` is public data. Mutations live outside
  it until they have auth to wear.
- **`access: "pro"` items appear in listings** but their files answer 402 at
  the install endpoints - the blockade is on the source, not on the fact of
  its existence.
- **Cached five minutes**, CORS open. It is meant to be fetched by other
  people's tools.

> [!NOTE] Agents have their own door
> An agent setting something up should start at `/agent-setup/prompt`, which
> routes to per-element instructions. This API is for reading, not installing.
