---
title: Field
summary: A labelled control with one line under it - the error is announced by being pointed at, not by being red.
updated:
---

Field pairs a label with a control and one line underneath it, showing either
a hint or, once one exists, an error - never both. Reach for it around any
form control that needs a label and a place to say what good input looks
like, or what went wrong.

<!-- ::start:showcase demo="field" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The control nests inside the `<label>` itself rather than being linked to it
by an id, which is the association that survives a refactor untouched. An
error does not just turn the note red: `aria-describedby` wires the note to
the control so a screen reader announces it as part of describing the
control, and `data-invalid` on the label is what actually carries the colour
- removing the colour and keeping the wiring still works for someone using
assistive tech, and the reverse does not.
