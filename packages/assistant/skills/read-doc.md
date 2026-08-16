---
name: read_doc
summary: Read a component's documentation page in full. Call this before explaining how anything works, rather than summarising from memory.
---

# read_doc

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| slug | string | yes | The component's registry name, exactly as `find_component` returns it. "folder-shelf", "device", "use-desk-state" |

## Returns

The Markdown source of the page, or nothing if there is no component by that
name.

## Notes

Paired with `find_component` on purpose: one finds the name, the other reads it.
A single skill that searched and returned full documents would send four whole
pages to answer "what is this called", and the token budget here is 700.

The docs in this repo carry the *reason* for each decision, not just the API, so
this is the skill that lets the assistant answer "why" questions with what was
actually written down instead of a plausible reconstruction.

> [!NOTE] Nothing returned is a real answer
> A slug with no page returns null rather than an error. The model is told to
> say it does not know, and a tool that throws makes it apologise for a failure
> instead.
