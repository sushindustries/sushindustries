---
title: Separator
summary: A rule with two directions and an accessibility decision: announced when it separates content, silent when it is furniture.
updated:
---

Separator draws a rule in either direction, horizontal or vertical. Pass
`decorative` for a purely visual divider that is hidden from screen readers;
leave it off when the rule genuinely separates content and should be
announced as one.

<!-- ::start:showcase demo="separator" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Whether a rule gets announced is an accessibility decision, not a styling
one, so `decorative` swaps the actual element rather than just its look: a
real `<hr>` when it separates content, a styled, `aria-hidden` span when it
is furniture. A data attribute alone could never have carried that
distinction honestly.
