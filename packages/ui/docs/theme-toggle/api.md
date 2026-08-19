---
title: Theme Toggle API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `options` | `readonly ThemeOption[]` | - | The segments, left to right. Arrows walk them and wrap at both ends. |
| `value` | `string` | - | The id of the pressed segment. One matching no option leaves the group with no tab stop. |
| `label?` | `string` | `"Theme"` | Names the group for screen readers. The segments are icons, so nothing else says what it switches. |

<!-- /generated:api -->

## Notes

A `value` that matches no `options[].id` is worse than it sounds: since no
segment is checked, none gets `tabIndex={0}`, and the whole group drops out
of the tab order - keyboard users cannot reach it at all until `value`
settles on a real id. Seed state from one of the actual `options`, never
from an empty string or a sentinel that isn't in the list. `options[].label`
never appears as visible text - it is the accessible name and the tooltip
on each button, so the icon alone carries the visual weight.
