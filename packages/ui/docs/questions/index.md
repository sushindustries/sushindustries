---
title: Questions
summary: The questions a page expects to be asked, written beside the prose that provokes them and answerable in place.
---

A page explains something and a reader arrives with a question about it. This
is the list of the three or four that actually get asked, written by whoever
wrote the page.

Given an `onAsk`, each one is a button that puts itself to an assistant;
without one it is a list of questions, which is a legitimate document and
exactly what renders on the server.

<!-- ::start:showcase demo="questions" height="320" -->
<!-- ::end:showcase -->

## What it does not do

It does not answer anything. It has no opinion about what is on the other end
of `onAsk`, which is why it is in the library at all: a component that knew
about this site's assistant would be a page, not a component.

It does not store, rank or count. "Popular" here means "the author knows these
get asked", not a measurement - there is no analytics behind it, and a list
that claimed to be ranked by real traffic while being hand-written would be
worse than an honest hand-written list.

It does not deduplicate. Two identical questions on one page are a mistake in
the content, and hiding it would only make it harder to find.
