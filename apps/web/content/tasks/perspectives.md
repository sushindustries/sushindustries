---
title: Admin and guest perspectives
summary: The studio has one role and it is the repository owner.
area: studio
status: todo
effort: m
order: 30
draft: false
---

The studio has one role and it is the repository owner. Anything shared with
anybody else - a writer who may edit posts but not rename packages - needs the
idea of a perspective before it needs a second user.

## What it touches

A capability set derived from the session, checked in the server functions
rather than in the components, and a switcher for the owner so a perspective
can be tried rather than reasoned about.

## Done means

A guest session can read and cannot reach any write path, proved by a test
against the server functions rather than against the page.

## What it is not

Not a user table. GitHub says who somebody is; this decides what that person
may do.
