---
name: keep-it-legal
description: The checklist that runs whenever a change touches visitor data - analytics, forms, cookies, localStorage, embeds, or any third-party request. Use before merging anything that stores, sends or reads something about a visitor, and when scaffolding privacy/cookies pages for a new site.
---

# Keep it legal

The legal pages on this site are statements of fact. They stay true because
every change that touches visitor data walks through this file before it
merges - not because anyone remembers to re-read the law.

## When this skill fires

Any change that does one of these:

- sends a request to a third party from the visitor's browser
- sets a cookie, or writes to localStorage/sessionStorage
- collects anything typed by a visitor (forms, search that leaves the page)
- embeds third-party content (video, fonts, scripts, iframes)
- adds, removes or reconfigures analytics

If none apply, stop here. If any apply, the change is not done until the
checklist below is.

## The lines to follow

1. **Name the data.** What exactly is collected, in one honest sentence. If
   the sentence is embarrassing, the feature is wrong, not the sentence.
2. **Name the basis.** Strictly necessary for what the visitor asked
   (no consent needed - the theme cookie), or everything else (consent,
   art. 6(1)(a) GDPR). There is no third category worth having on a
   personal site.
3. **Gate it.** Anything that is not strictly necessary fires only after the
   `Consent` block reports a yes. Pending and no are the same silence.
   PostHog's gate is `opt_out_capturing_by_default` + `opt_in_capturing()` in
   `apps/web/src/integrations/posthog/provider.tsx` - new tools follow the
   same shape.
4. **Update the pages.** `apps/web/content/pages/privacy.md` (what, why,
   basis, processor, retention) and `apps/web/content/pages/cookies.md`
   (every cookie in the table, every localStorage key in the list). A legal
   page that lags the code is worse than no page - it is a false statement
   with a timestamp.
5. **Keep the buttons equal.** The consent bar renders both answers the same
   size by stylesheet rule (`consent.css`). Nothing added later may shrink,
   hide, pre-tick or re-ask the no.
6. **Prefer the proxy.** Third-party requests ride the site's own origin
   (`/ingest` in `nitro.config.ts` + the dev proxy in `vite.config.ts`) so
   the CSP stays at `'self'`. A new vendor gets a new relay path, not a CSP
   hole.

## Scaffolding a new site's legal pages

`templates/page-privacy.md` and `templates/page-cookies.md` are the reusable
halves - markdown-block pages with `{owner}`, `{site}`, `{date}` tokens and
HTML comments marking every line that must be filled with that site's own
facts. Copy, fill the tokens, delete no section without reading it: each one
answers a question the GDPR requires answered (controller, data, basis,
retention, rights, complaint authority).

The tone is allowed to be funny. The facts are not allowed to be wrong. When
the two collide, the joke loses.

## The prompt, for reuse elsewhere

> This change touches visitor data. Walk `keep-it-legal`: (1) name the data
> in one sentence, (2) name the legal basis, (3) gate anything non-essential
> behind the Consent block, (4) update privacy.md and cookies.md so both
> stay literally true, (5) verify both consent buttons stay equal, (6) route
> any new third-party endpoint through a first-party relay. Report what
> changed on each of the six lines.
