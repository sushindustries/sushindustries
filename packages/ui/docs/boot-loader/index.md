---
title: Boot Loader
summary: A count to a hundred that stalls at ninety until the thing it is covering has actually arrived.
---

A machine booting: a mark, a number, and a rule.

<!-- ::start:showcase demo="boot-loader" height="340" -->
<!-- ::end:showcase -->

## The number is not a measurement, and that is the point

Nothing on this page can report real progress. A GLB has either arrived or it
has not; a font either is or is not. A number derived from bytes would jump
from 0 to 100 with nothing in between, which is worse than no number.

So this eases to **90 on a timer**, waits there for `ready`, then runs to 100.

That makes it honest in a different way. The number is a promise about
*attention* rather than about bytes - it says something is happening and
roughly how long is left - and it can never claim to be finished while the
thing it covers has not arrived.

```tsx
<BootLoader ready={modelLoaded} onDone={reveal}>
	<SpinningMark />
</BootLoader>
```

| Without `ready` | With it |
| --- | --- |
| Finishes on schedule whether or not anything loaded | Cannot reach 100 until the work reports in |
| The reveal shows an empty canvas | The reveal shows the thing |

> [!NOTE] Ninety, not ninety-nine
> A counter parked on 99 reads as stuck. One at 90 reads as nearly there, and
> the last tenth is where the eye expects a pause anyway.
