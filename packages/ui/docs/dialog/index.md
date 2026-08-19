---
title: Dialog
summary: A native dialog driven by props: top layer, focus trap and Escape from the element, click-outside from here.
updated:
---

Dialog is a native `<dialog>` driven entirely by props: `open` shows it modal,
and `onClose` fires from Escape, the backdrop, or its own close button. Reach
for it to hold a reader until they answer something, like a confirmation -
not for a menu meant to be dismissed in passing.

<!-- ::start:showcase demo="dialog" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

`showModal` already supplies the top layer, focus trap, Escape and the
backdrop, so this component adds only what is missing: the frame, the title
the dialog is labelled by, and click-outside. Command Palette is this same
recipe with a filter bolted on, and the two stay separate components because
a dialog's job is to hold the page, and a palette's is to let you leave it
quickly.
