---
title: Avatar API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `src?` | `string` | - | Image URL. Absent or failed, the initials take over. |
| `name` | `string` | - | The person's name; the alt text and the source of the initials. |
| `size?` | `number` | `32` | Pixel size. |
| `tone?` | `string` | - | Colour family for the initials fill. |

### AvatarGroupProps

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `people` | `readonly Pick<AvatarProps, "name" \| "src" \| "tone">[]` | - | In display order; the first renders on top. |
| `max?` | `number` | `4` | How many faces before the count takes over. |
| `size?` | `number` | `32` | Pixel size of every face, the overflow count included. |

<!-- /generated:api -->

## Notes

`AvatarGroup`'s `people` accepts `name`, `src` and `tone` only - any other
field on a source object (an id, a role) is not read by this component
and should stay in the array the host maps from rather than being passed
through. `max` clamps the visible faces but never removes anyone from the
overflow count; passing `max={0}` renders only the "+N" badge, with every
person folded into it.
