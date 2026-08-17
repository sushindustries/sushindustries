---
title: Glyphs
summary: The icon set, as data. `packages/ui/src/icon.tsx` is generated from this table.
---

# Glyphs

Every icon this library draws, one row each.

This file is the source and `src/icon.tsx` is the output. `pnpm doctor`
regenerates it and fails if the two have drifted, so editing the component by
hand is a change that gets reverted rather than a change that sticks. Add a
glyph here, run `pnpm doctor --fix`, and the `IconName` union, the paths and
the component all follow.

Paths only, no other SVG element, and each one drawn inside a 24x24 box at a
1.5 stroke. A circle is written as a path like anything else. That constraint
is what keeps the generator four lines instead of an SVG parser, and it has
never yet been the reason a glyph could not be drawn.

Multiple paths per glyph go in separate backticks in the same cell.

## The set

| Name | Paths | Why this drawing |
| --- | --- | --- |
| cube | `M12 2.5 21 7v10l-9 4.5L3 17V7z` `M3 7l9 4.5L21 7` `M12 11.5v10` | An isometric cube. The 3D viewer. |
| package | `M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z` `M7.5 5.25 16.5 9.75V18` | A taped box seen from above. |
| note | `M5 3h9l5 5v13H5z` `M14 3v5h5` `M9 13h6M9 17h4` | A page with a folded corner and two lines of writing. |
| layers | `M12 3 3 8l9 5 9-5z` `M3 13.5 12 18.5l9-5` | Two stacked plates. Components, which are things on things. |
| motion | `M3 17c4-9 14-9 18 0` `M20 14.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0` | An arc with a leading dot: something travelling, not something spinning. |
| grid | `M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z` | Four cells. Layout, and what the Grid component does. |
| text | `M4 6h16M4 11h12M4 16h14M4 21h8` | Ragged lines. Prose, which is what content means here. |
| book | `M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z` `M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z` | An open book. Docs. |
| rule | `M4 6h16M4 18h16` `M12 10v4` | A gap held open between two rules. The Spacer, drawn as the thing it inserts. |
| chevron | `M6 9.5 12 15l6-5.5` | Down. Rotated by CSS wherever it needs to point elsewhere. |
| folder | `M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h9A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z` | A tab and a body. The one shape everyone already reads as "things are in here". |
| folder-open | `M3 7a1.5 1.5 0 0 1 1.5-1.5h4L11 8h8A1.5 1.5 0 0 1 20.5 9.5v1` `M3 17.2 5.4 11a1.5 1.5 0 0 1 1.4-1h14.1a1 1 0 0 1 .95 1.3L19.8 18a1.5 1.5 0 0 1-1.4 1H4.5A1.5 1.5 0 0 1 3 17.5z` | The same folder with its front leaning away. Open, without a second metaphor. |
| file | `M6 3h8l4 4v14H6z` `M14 3v4h4` `M9 12h6M9 16h4` | A page with a folded corner and two lines. A thing, not a container. |
| dots | `M12 5.5a1 1 0 1 0 0-.01` `M12 12.5a1 1 0 1 0 0-.01` `M12 19.5a1 1 0 1 0 0-.01` | Three dots. The menu you can reach without a right mouse button. |
| download | `M12 3v11` `M7.5 10 12 14.5 16.5 10` `M4 17.5v2A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-2` | An arrow into a tray. Down means onto your machine. |
| share | `M12 16V4` `M7.5 8.5 12 4l4.5 4.5` `M4 15v4.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V15` | The download arrow, reversed. Up means away from here. |
| link | `M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.2 1.2` `M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.2-1.2` | Two links of a chain. |
| close | `M6 6l12 12M18 6 6 18` | A cross. Nothing else means close. |
| search | `M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z` `M16.2 16.2 21 21` | A lens and a handle. |
| sushi | `M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z` `M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z` `M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z` `M3.2 12h1.6` `M19.2 12h1.6` `M12 3.2v1.6` `M12 19.2v1.6` | A maki roll seen end on, which is the only angle at which a roll is legible at 24px: nori, rice, filling, three concentric circles. The four ticks are the tell - they are register marks rather than decoration, and they are what stops it reading as a record, a target or a loading spinner. |
| sun | `M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z` `M12 2.5v2` `M12 19.5v2` `M4.2 4.2l1.4 1.4` `M18.4 18.4l1.4 1.4` `M2.5 12h2` `M19.5 12h2` `M4.2 19.8l1.4-1.4` `M18.4 5.6l1.4-1.4` | A disc and eight rays. Eight rather than four, because four reads as a compass; and the rays are detached from the disc so the whole thing still resolves at 15px. |
| moon | `M20 14.5A8.5 8.5 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z` | One crescent, cut by an offset circle rather than drawn as a shape. A moon with stars beside it is three marks fighting for the same 15 pixels. |
| contrast | `M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z` `M12 3v18a9 9 0 0 0 0-18z` | A circle half filled: the standard mark for "follow the system", and the only one of the three that means a rule rather than a state. |
| chat | `M4 5h16v11H9l-5 4z` | One speech bubble with a tail, and no second bubble behind it. Two bubbles say conversation and are half the size each at 24px, where the tail is the only part that still reads. |
| linkedin | `M4 4h16v16H4z` `M8 10.5v6` `M8 7.6v.1` `M11.6 16.5v-6` `M11.6 13.2a2.6 2.6 0 0 1 5.2 0v3.3` | The wordmark reduced to its two letters in a square, drawn at this stroke weight rather than pasted in as a logo. |
| clock | `M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z` `M12 7.6V12l3 1.8` | A face and two hands. |
| copy | `M9 8.5h10.5V21H9z` `M5 15.5v-12h9` | Two pages, the front one whole and the back one implied by two edges. The duplicate is the message, not the clipboard. |
| github | `M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4` `M9 18c-4.51 2-5-2-7-2` | The octocat as an outline, at this set's stroke rather than as a pasted logo - the tentacle-arm is the part that makes it read at 15px. |
| cursor | `M6 3.5 19 11l-5.6 1.6L10 19z` | A pointer, mid-click. The editor named after it uses the same shape for the same reason. |
| spark | `M12 3v18` `M4.2 7.5l15.6 9` `M19.8 7.5 4.2 16.5` | A six-ray asterisk: the generic mark for an AI assistant, drawn at this set's stroke rather than borrowed from any one vendor. |
| terminal | `M4 5h16v14H4z` `M7.5 9.5 10.5 12l-3 2.5` `M12.5 15h4` | A frame, a prompt chevron, a cursor line. The shell, drawn as the window it runs in. |
| star | `M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z` | Five points, closed. The one shape GitHub taught everyone to press. |
| check | `M5 13l4.5 4.5L19 7.5` | A tick. It replaces the copy glyph for a moment, so it is drawn at the same weight and nothing else moves. |
| play | `M8.5 5.5 18.5 12l-10 6.5z` | A right-pointing triangle, closed. The one control nobody has to be taught. |
| pause | `M9.5 5.5v13M14.5 5.5v13` | Two bars at the play triangle's height, so the button does not change size when it changes meaning. |
| expand | `M9.5 4.5h-5v5` `M14.5 19.5h5v-5` `M4.5 4.5 10 10` `M19.5 19.5 14 14` | Two corners and the arrows leaving them. Fullscreen, drawn as the direction it goes. |

## Adding one

```shell
pnpm new glyph my-glyph
pnpm doctor --fix
```

The first adds a row with an empty path and tells you to draw it. The second
regenerates the component. A row with no path is reported, not silently
rendered as an empty square.

## Why not an icon package

Ten glyphs at one stroke weight is about a kilobyte. An icon package is a
dependency, a build step and a tree-shaking question, and the thing you
actually wanted was ten shapes.

`currentColor` and no `fill` mean every glyph inherits whatever the label
beside it is doing, including its hover and focus states. That is the part a
sprite sheet gets wrong.

The set is deliberately closed and small. Every registry category has exactly
one glyph, so a category cannot be added without deciding what it looks like,
and a category with no icon in a menu that shows icons is a hole rather than a
default.
