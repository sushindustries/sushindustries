# @sushindustries/http

[GitHub Packages](https://github.com/sushindustries/sushindustries/pkgs/npm/http)

The five things a server decides about a response before it decides what is in
it: which origin is canonical, how long the answer may be cached, what the
document is allowed to load, which embed hosts that permits, and which
representation to hand back when the client asks for a different one.

`Request` in, `Response` out. No framework, no router, no config file, so the
same functions run inside a request middleware, a worker, or a test that never
starts a server.

## Install

```bash
pnpm add @sushindustries/http
```

## Use

Everything here is meant to be composed in one request middleware, in the
order a response is actually decided.

```ts
import {
	cacheControl,
	canonicalRedirect,
	markdownRedirect,
	securityHeaders,
} from "@sushindustries/http";

// Before any work: the www twin of the canonical host gets its 301 and
// nothing else. Rendering a page in order to redirect away from it is work
// the response throws away.
const redirect = canonicalRedirect(request, "https://example.com");
if (redirect) return redirect;

// A client asking for a representation this server has at another URL.
const markdown = markdownRedirect(request);
if (markdown) return markdown;

const response = await next();

// Headers go on after the response exists, never before.
securityHeaders(response.headers, { nonce });
cacheControl(response.headers, request);
```

## What each one is for

| Export | Decides |
| --- | --- |
| `canonicalRedirect(request, origin)` | that one origin serves the site, and the `www.` twin redirects to it |
| `cacheControl(headers, request)` | how long this answer may be reused |
| `contentSecurityPolicy(options)` | the policy string, nonce included |
| `securityHeaders(headers, options)` | that policy plus the headers that travel with it |
| `EMBED_PROVIDERS` / `embedOrigins(...)` | which third-party hosts an embed may come from, in one list the policy reads |
| `markdownRedirect(request)` | that `Accept: text/markdown` on a page URL goes to that page's Markdown |

## Why the origin is a parameter

`canonicalRedirect` takes the canonical origin rather than reading it from a
module of its own. The site that owns the URL keeps owning it, which is what
makes this installable somewhere else instead of being a copy of one site's
constant.

Only the `www.` twin of that host redirects. Localhost and a platform's own
service domain stay reachable as themselves, because a health check that gets
a 301 to another host is not checking that deployment.

## Content negotiation assumes mirrors

`markdownRedirect` sends `Accept: text/markdown` to `<path>/index.md`. It
assumes the site publishes a Markdown mirror at each page's own path, which is
the convention `@sushindustries/llms` builds indexes for. Machine endpoints
and anything with an extension are excluded, because those already name their
own format.
