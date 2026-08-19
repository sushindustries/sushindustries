---
title: A settings section
summary: Every knob the studio has is an environment variable somebody has to know exists: `STUDIO_BRANCH`, `STUDIO_LOCAL_WRITES`, `DEV_SIGNIN`, `GITHUB_WRITE_TOKEN`.
area: studio
status: todo
effort: m
order: 20
draft: false
---

Every knob the studio has is an environment variable somebody has to know
exists: `STUDIO_BRANCH`, `STUDIO_LOCAL_WRITES`, `DEV_SIGNIN`,
`GITHUB_WRITE_TOKEN`. The setup command reports them and nothing shows them.

## What it touches

A `/studio/settings` section reading the same checks `pnpm sushindustries
setup` runs, so one list of what a deployment needs serves both.

## Done means

The section names every variable the studio reads, says which are set, and
never prints a value - a settings page that echoes a token is a token in a
screenshot.

## What it is not

Not a place to *set* them. Railway holds the variables; a form here would be a
second source that the next deploy overwrites.
