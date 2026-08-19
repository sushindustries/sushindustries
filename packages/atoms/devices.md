# Devices

The three machines the site can be drawn as, and the widths at which each one
takes over.

This table is the only place these numbers are written down. `pnpm run doctor`
generates two files from it:

| Output | Why it cannot just read this file |
| --- | --- |
| `packages/atoms/src/devices.css` | A media query needs a literal width. There is no custom property that can be queried, and there never has been. |
| `packages/ui/src/device-kinds.ts` | The assistant tells the model which machine it is running on, so the client has to know the same widths the stylesheet does. |

Before this, those widths existed in three places and agreed by luck.

## The machines

`From` is a `min-width`, so a row applies from that width up until the next row
takes over. The first row has no lower bound and is therefore the default -
which means the phone is what a browser that fails every media query gets, and
that is the right way round.

| Kind | From | Width | Aspect | Columns | Bezel | Corner | Lens | Tilt | Chrome | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| phone | `0` | `22rem` | `3 / 6` | `3` | `6px` | `2.25rem` | `1100px` | `-1deg` | `camera` | Held, so it is nearly face on. A phone tilted like a laptop reads as a phone falling over. |
| tablet | `720px` | `40rem` | `3 / 4` | `5` | `10px` | `1.5rem` | `1300px` | `-2deg` | `camera` | Propped, so a little more rake than a phone and a lot less than a laptop. The 3:4 slab is the shape that says tablet without a keyboard under it. |
| laptop | `1080px` | `60rem` | `16 / 10.4` | `7` | `8px` | `0.75rem` | `1400px` | `-4deg` | `deck` `hinge` | A long lens, because the machine should look like it is being looked at rather than photographed from six inches away. |

## The columns

| Column | What it sets | Notes |
| --- | --- | --- |
| `Kind` | `data-device` and the `DeviceKind` union | Lowercase, one word. It is a value in markup and a value in a type. |
| `From` | the `min-width` of the generated media query | `0` means no query at all. Ascending order is required and the doctor checks it. |
| `Width` | the widest the machine is ever drawn | It is a `max-width`, not a width: the machine still shrinks to the column it is in. Without it, a phone chosen on a wide monitor is 960px across and 1920px tall, which is not a phone. |
| `Aspect` | `aspect-ratio` on the body | Why every machine has one: the screen is the shape, and a fixed aspect is what keeps the shape when the column it sits in changes width. |
| `Columns` | how many icons wide the desktop is | Fewer on a smaller machine, which is what makes a phone's icons read as apps rather than as a shrunken file listing. A window inside the screen ignores this and keeps its own `auto-fit`, because a window is not the desktop. |
| `Bezel` | how far the screen is inset from the edge of the body | A phone's is thin because phone bezels are thin now. |
| `Corner` | `border-radius` on the body | The single strongest signal of which machine this is, more than the aspect ratio. |
| `Lens` | `perspective` on the stage | Smaller is a wider angle and more distortion. Nothing here wants distortion. |
| `Tilt` | `rotateX` on the body | The only reason the perspective has anything to do. Zero would render an ordinary rectangle and the whole 3D stage would be dead weight. |
| `Chrome` | which decorative parts are shown | Any part not named is set to `display: none`. |
| `Why` | nothing | It is the column that stops a number being changed because it looked wrong. |

## Chrome parts

Every part is always in the DOM and shown or hidden by the stylesheet. That is
the load-bearing decision in the whole file, so it is worth saying plainly:

**The machine is chosen by CSS, never by JavaScript.**

A component that measures the window and renders a phone or a laptop renders
neither on the server, so the first paint is wrong and the correction is a
visible flash - and if it guesses, it guesses differently than the client and
React throws the tree away. Rendering all three and letting media queries
decide costs four empty `<div>`s and is correct before a single byte of
JavaScript arrives.

| Part | Element | Appears on |
| --- | --- | --- |
| `deck` | `.device-base` | laptop. The keyboard half, raked away in 3D. |
| `hinge` | `.device-hinge` | laptop. A seam where the lid meets the deck. |
| `camera` | `.device-camera` | phone, tablet. One dot. A notch would be a specific vendor's phone. |
| `bar` | `.device-bar` | nothing. It was a home indicator on the phone and the tablet, and a rounded pill across the bottom of a screen is one specific vendor's furniture rather than a fact about handhelds. Kept as a part because the machinery for hiding a part is the interesting half, and this is now the case that proves a part can be listed and never used. |

## Choosing by hand

`data-device` on the element overrides the media query, and every generated
rule is written twice for exactly that reason - once under its query for
`:not([data-device])`, once as an attribute selector with no query at all.

That is what `@sushindustries/prefs` writes when somebody picks a machine in
Settings, and it is also how the showcase can put all three side by side on one
screen.

```html
<div class="device" data-device="tablet">
```

## Adding one

Add a row, run `pnpm run doctor --fix`, then use the new kind. The type, the media
query, the attribute selector and the assistant's idea of where it is running
all follow from the row.

A row with a `From` that is not larger than the row above it is rejected: the
later rule would be dead, and a dead media query is invisible in a diff and
obvious in a browser six weeks later.
