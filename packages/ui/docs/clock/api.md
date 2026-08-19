---
title: Clock API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `every?` | `number` | `15_000` | How often to re-read the time, in milliseconds. A clock showing minutes has no reason to tick every second: fifteen seconds is close enough that the displayed minute is never wrong for long, and it is four wake-ups a minute instead of sixty. |
| `options?` | `Intl.DateTimeFormatOptions` | `DEFAULT` | Passed straight to `Intl.DateTimeFormat`. |
| `placeholder?` | `string` | `"--:--"` | Shown until the first client render. |

<!-- /generated:api -->

## Notes

`options` is passed straight to `Intl.DateTimeFormat` with no validation - an
invalid combination throws inside the effect, exactly as it would calling the
constructor by hand. `every` and `options` are independent: nothing keeps a
fast interval in step with a coarse format or the other way round, so pick
both together (see Guides).

`placeholder` only ever appears once, before the first tick. There is no prop
that brings it back once a real time has been read.
