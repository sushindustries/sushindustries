---
title: Consent
summary: A non-modal consent bar with equal-weight answers. It renders the question and reports the click; the host owns the SDK, the storage and the law.
updated: 2026-08-18
---

A privacy question docked to the corner of the screen, with both answers the
same size. It renders when `open` is true, reports which button was pressed,
and does nothing else - the analytics SDK, the stored answer and the
regulation being satisfied all belong to the host.

<!-- ::start:showcase demo="consent" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

**It knows no vendor.** A consent bar hard-wired to one analytics SDK is that
vendor's plugin, not a component. `onAccept` and `onDecline` are the whole
contract, so the same bar fronts PostHog today and whatever replaces it
without touching this file.

**It is non-modal, and that is the legal shape.** The regulation this exists
for says a visitor may ignore the question and keep reading - so there is no
backdrop, no focus trap, and the page behind stays live. A consent dialog
that blocks the content answers "may I track you" with a hostage.

**Both buttons are the same size**, by a rule in the stylesheet rather than
by discipline. Declining must cost the same click as accepting; the shrunken
grey "no" is the dark pattern regulators name, and this block refuses to
render one.

## What it does not do

It does not remember the answer - keep `open` false once one is recorded,
wherever you record it. It does not block rendering, set cookies, or talk to
any network. And it does not decide *when* to ask: mount it when your own
consent state says the question is still open.
