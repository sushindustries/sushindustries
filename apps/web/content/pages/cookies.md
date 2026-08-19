---
title: Cookies
summary: The complete cookie inventory of this site. It is one cookie, and it remembers which theme you picked.
---

This is the page where a site usually confesses to forty vendors. Here is the
entire inventory:

| Name | What it holds | Who set it | Lives for |
| --- | --- | --- | --- |
| `sushi-theme` | `light` or `dark` - the theme you picked | this site | a year |

That is the whole table. One first-party cookie, storing a preference you set
yourself by pressing a button, read by the server so the page arrives already
in your theme instead of flashing into it. The law calls this strictly
functional, which is why no banner asked about it - it does only the thing
you requested.

## What lives in localStorage instead

A few things are remembered by your browser without ever being sent anywhere:

- **Your consent answer** - so the privacy question is asked once, not on
  every visit.
- **Your desk layout** - if you arranged windows on the home screen, that
  arrangement is yours and stays on your machine.
- **Analytics state** - only if you pressed Allow. PostHog is configured to
  use localStorage, not cookies, so even with consent granted this site sets
  no tracking cookie. The measuring is described in the
  [privacy note](/p/privacy).

## Changing your mind

Consent is not a tattoo. To take back a yes - or reconsider a no - clear this
site's data in your browser (usually under the padlock icon, "Site settings",
"Delete data") and the question returns on your next visit, unoffended.
Declining keeps everything exactly as functional as accepting; the only
difference is that I never find out you were here.
