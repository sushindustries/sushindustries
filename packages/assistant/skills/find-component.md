---
name: find_component
summary: Search the component library. Use this whenever the reader asks what exists, what something is called, or what to use for a job.
---

# find_component

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| query | string | yes | A component name, or words describing what it should do. "scroll", "a laptop frame", "reveal" |
| limit | number | no | How many to return. Default 5, maximum 12 |

## Returns

A list of components, each with its name, title, description, category and the
path to its page.

## Notes

This is the skill that stops the assistant inventing components. The library is
about two dozen items and changes with every release, so an answer assembled
from a model's memory of the README is an answer that is confidently one
version out of date.

The description is written at the model rather than at a reader, and the phrase
that does the work is **"whenever the reader asks what exists"**. Without it the
model answers from the system prompt for anything it half-recognises and only
reaches for this when it is already unsure - which is exactly backwards.
