---
title: Showcase
summary: A component at every width it has to survive, with its source, install commands, and a live StackBlitz editor.
---

The frame below is the component this page documents, showing another
component. Switch the width - the layout changes because the preview really is
a different viewport.

<!-- ::start:showcase demo="card" height="380" -->
<!-- ::end:showcase -->

## Why an iframe

Because a resized `div` lies.

A div at 390px still inherits the page's viewport, so `@media (max-width: 860px)`
never fires inside it. A component can look perfect in a showcase built that way
and break on an actual phone. An iframe has its own viewport, so the media
queries that run are the real ones.

## The widths

Not a rounded-off guess at popular phones. Each width sits on one side of a
breakpoint this stylesheet actually contains, so the set exercises every branch
in it and nothing else.

| Width | Why that number |
| --- | --- |
| 320 | the floor. Every component here works from this width up |
| 390 | the commonest real phone, still under the 860px breakpoint |
| 900 | between 860 and 1080: past the phone layout, short of the wide one |
| Desktop | whatever the page has. Pinning it to 1280 misreports a laptop |

Each frame says which width it is and why. A frame with no label is a
screenshot; a labelled one is a claim you can check.

## Compare

**Compare** puts all four side by side in a row that scrolls.

One width at a time answers "does it work here", which is usually the question
you already know the answer to. All of them at once answers "where does it stop
working", which is the one worth a screenful. The frames align to the top, so a
short component does not stretch its frame to match the tallest one and hide
the fact that it was short.

There is no transition on the device toggle. It gets pressed a dozen times
while reading one page, and on a control used that often an animation reads as
lag rather than as polish - the state change is the feedback.

## StackBlitz

The **StackBlitz** tab opens a live, editable copy of the demo in a real
WebContainer. The reader can change the code and see the result without leaving
the page.

The project is built from the same source the Code tab shows - the demo's
`source` string becomes `src/Demo.tsx` in a React + TypeScript project that
imports `@sushindustries/ui` and `@sushindustries/atoms`. So the editable copy
is the same code the reader was just looking at, not a reconstruction of it.

The StackBlitz SDK is wired in the app layer, not in the Showcase component
itself, for the same reason the code highlighter is: `packages/ui` has no
business depending on the StackBlitz SDK. The Showcase component takes a
`renderStackblitz` render prop and decides where it goes; the host builds the
project and hands it to the SDK.

## What else it shows

| Control | Does |
| --- | --- |
| Preview / Code / StackBlitz | the running component, the source, or a live editor |
| Install rows | the TanStack and shadcn commands, attached automatically |

> [!NOTE] Install commands are not written by hand
> Anything in the registry gets its commands attached from its registry entry,
> so "how do I get this" is never something an author has to remember.
