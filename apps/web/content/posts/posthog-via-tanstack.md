---
title: Analytics that asks first
date: 2026-08-17
summary: PostHog in a TanStack Start app - a provider in the integrations directory, a first-party relay, and a consent bar that gates every event.
tags: [tanstack, analytics, privacy]
---

This site now counts its page views, and the whole arrangement is four small
pieces. None of them is clever on its own; the point is where each one lives.

## The provider, where TanStack puts integrations

TanStack's scaffolding convention gives every integration a home under
`src/integrations/<name>/`, wired once at the root route. The PostHog half of
this site is `src/integrations/posthog/provider.tsx`: a `Measure` component
that wraps the app in `PostHogProvider` from `@posthog/react` and mounts the
consent bar beside it.

```tsx
<Measure>
	<SiteNav />
	<main>{children}</main>
	<SiteFooter />
</Measure>
```

The bare preview branch - the iframes the component archive renders - never
mounts it, so eighteen thumbnails ask nobody anything and count nothing.

Unconfigured means dark, never broken: when the key is absent the provider
renders its children and walks away. Analytics is decoration, and a
decoration must not be able to take down a page.

## The relay, so the CSP never widens

The client is told `api_host: "/ingest"`. A Nitro route rule relays that path
to PostHog's EU cloud in production, and a Vite `server.proxy` entry does the
same in development - same path, same destination, so the client never knows
which server it is behind.

What that buys: `connect-src 'self'` stays exactly that, no third-party
hostname ever appears in the page's network traffic, and blocklists keyed on
analytics domains have nothing to match.

## The consent bar, which is a component now

The bar itself is `Consent` in the component library - vendor-agnostic,
non-modal, both buttons the same size by stylesheet rule. The site wires it
to PostHog's own consent state: `opt_out_capturing_by_default` keeps the SDK
silent, `get_explicit_consent_status()` decides whether the question is still
open, and `opt_in_capturing()` is the only thing a yes does.

Pending and no are the same silence. Only an explicit yes starts the stream.

## The paperwork, which is also content

`persistence: "localStorage"` means PostHog sets no cookies at all, which
lets the [cookies page](/p/cookies) publish its entire inventory as one
functional theme cookie - and the [privacy note](/p/privacy) says what is
measured, on what legal basis, and how to take a yes back.

The rule that keeps those pages true lives in the repo as a checklist:
any change that touches visitor data updates the legal pages in the same
commit, or it does not merge.
