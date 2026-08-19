---
title: Code Block API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `code` | `string` | - | The source. One trailing newline is dropped, so the copy is exactly what is shown. |
| `language?` | `string` | - | Fence language. Aliases like `bash` and `js` resolve; unknown falls back to plaintext. |
| `copy?` | `boolean` | `true` | The copy button is the default; a caller showing a fragment can decline it. |
| `file?` | `string` | - | Filename from the fence's `file="..."` metadata, shown above the code. |

<!-- /generated:api -->

## Notes

`copy` and `file` both being unset is the only case that skips the
`code-shell` wrapper and its tools row entirely - set either one and you get
the wrapper, the language chip, and whichever of the two you asked for.

`language` never throws. An alias resolves through `resolveLanguage`
(`bash`, `js`, `jsx` and a few others); anything else that is not a
registered grammar falls back to `plaintext`, rendered but unstyled, rather
than failing the build or the render.
