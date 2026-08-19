# 11 - server routes need real HTTP semantics

**Rule:** a server route (`createFileRoute` with a `server` block) exists
only when the endpoint has genuine HTTP semantics an RPC envelope couldn't
give it - streaming, webhooks, crawler/machine files, health checks. Internal
app RPC uses a server function instead.

**Why:** Official + Project convention (the Project-convention half is this
repo's own call, recorded in `pipeline.md`, not a foreign one).

**Check:** read each server route file's own justification comment; verify
against the allowlist (webhooks, files, health, auth callbacks, public
machine endpoints, streaming).

**Last checked:** 2026-08-18 - **PASSED**. All 21 server routes fit the
allowlist: crawler/machine files (`llms.txt`, `sitemap.xml`, `robots.txt`,
`r/*.json`), `health`, CLI/agent integration endpoints (`r/shadcn`,
`r/tanstack`, `r/prompt`, `r/md`, `agent-setup/prompt`), a public API
(`api/v1/*`), and one streaming response (`api/chat` - verified against the
file's own comment: "the caller wants a long-lived `text/event-stream`
response... a server function would wrap the same bytes in an RPC envelope
the client would have to unwrap before it could stream anything"). No
internal RPC misplaced here - see also rule `05-no-duplicate-server-route-methods.md`.

**Source:** `references/01-tanstack-official-safety.md`.
