---
title: Boot Loader API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children?` | `ReactNode` | - | Drawn in the middle, above the counter. A spinning mark, usually. |
| `duration?` | `number` | `1600` | Roughly how long a full run takes, in milliseconds. |
| `ready?` | `boolean` | `true` | True once whatever this is waiting for has arrived. The count runs on its own and stalls near the end until this flips. That is the whole design: a progress bar that finishes before the thing it is measuring is a progress bar that lies, and one that only moves when real work reports in sits at zero for two seconds and looks broken. |
| `onDone?` | `() => void` | - | Called once the counter has reached a hundred and faded. |
| `label?` | `string` | `"Loading"` | Read out instead of the number, which is meaningless spoken. |

<!-- /generated:api -->

## Notes

`duration` only governs the climb to 90 - the run from 90 to 100 once
`ready` flips happens on its own fixed timing, not a fraction of
`duration`. Passing `ready={true}` from the first render skips the stall
entirely and the count runs straight through to 100.

`onDone` fires once, after the fade beat, and only if the component is
still mounted to see `ready` flip - unmounting it early, by routing away
mid-load, means the callback never runs, so nothing that has to happen
should depend on it firing.
