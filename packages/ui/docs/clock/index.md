---
title: Clock
summary: The reader's own day and time, in the reader's own zone, without asking anybody for a location.
---

Clock renders the reader's own local weekday and time, using `Intl.DateTimeFormat`
with no locale or time zone set. Reach for it in a footer, a status bar, or
anywhere a page wants a live clock without asking for a location or talking to
a server.

<!-- ::start:showcase demo="clock" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

It renders nothing on the server, on purpose. A server has its own clock and
zone, so a real time rendered there would say one thing while the first client
render says another - a hydration mismatch, which React answers by discarding
and rebuilding the whole tree. Clock shows a placeholder on both the server
and the first client frame, then fills in the real value from an effect
afterward, so there is never a mismatch to suppress.
